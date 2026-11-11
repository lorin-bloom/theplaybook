/**
 * The single gateway for structured model calls: output caching, budget
 * check, usage recording, schema validation, and a labelled mock mode.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { eq } from "drizzle-orm";
import type { z } from "zod";
import { getConfig, type ModelRole } from "@/lib/config";
import { getDb, schema } from "@/lib/db";
import { assertBudget, estimateCost, recordUsage } from "@/lib/cost/budget";
import { hashOf } from "@/lib/util/hash";
import { UNTRUSTED_DATA_POLICY } from "@/lib/security/injection";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("The Playbook isn’t available right now. Please try again later.");
  }
}
export class AiOutputError extends Error {}

let injectedClient: Pick<Anthropic, "beta"> | null = null;
/** Tests inject a fake client so no network or paid call is ever made. */
export function setAnthropicClientForTests(c: Pick<Anthropic, "beta"> | null) {
  injectedClient = c;
}
let realClient: Anthropic | null = null;
export function anthropic(): Pick<Anthropic, "beta"> {
  if (injectedClient) return injectedClient;
  realClient ??= new Anthropic({ maxRetries: 2 });
  return realClient;
}

export type GenerationMode = "live" | "mock";
export function generationMode(): GenerationMode {
  const mode = getConfig().aiMode;
  if (mode === "off" && !injectedClient) throw new AiNotConfiguredError();
  return mode === "mock" && !injectedClient ? "mock" : "live";
}

export type StructuredCall<S extends z.ZodType> = {
  operation: string;
  role: ModelRole;
  schema: S;
  promptVersion: string;
  /** Stable instructions — prefix-cached by the API and part of our cache key. */
  system: string;
  user: string;
  playbookId: string | null;
  maxTokens: number;
  expectedOutputTokens: number;
  /** Deterministic development fixture, used only when AI_MODE=mock. */
  mock: () => z.infer<S>;
  /**
   * "strict" uses API structured outputs (guaranteed JSON). "prompt" relies on
   * a JSON shape described in the system prompt + tolerant validation — needed
   * for large schemas whose compiled grammar exceeds the API limit.
   */
  jsonMode?: "strict" | "prompt";
};

/** Pulls the outermost JSON object out of a model reply (tolerates stray fences or prose). */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new SyntaxError("no JSON object");
  return JSON.parse(text.slice(start, end + 1));
}

export async function callStructured<S extends z.ZodType>(call: StructuredCall<S>): Promise<{ data: z.infer<S>; model: string; mode: GenerationMode; cached: boolean; costUsd: number }> {
  const mode = generationMode();
  const cfg = getConfig();
  const model = mode === "mock" ? "mock" : cfg.models[call.role];
  const system = `${call.system}\n\n${UNTRUSTED_DATA_POLICY}`;
  const key = hashOf({ op: call.operation, model, pv: call.promptVersion, system, user: call.user });
  const db = await getDb();

  const [hit] = await db.select().from(schema.llmCache).where(eq(schema.llmCache.key, key));
  if (hit) {
    const parsed = call.schema.safeParse(hit.output);
    if (parsed.success) {
      await recordUsage({ playbookId: call.playbookId, operation: call.operation, model, usage: { inputTokens: 0, outputTokens: 0 }, cached: true });
      return { data: parsed.data, model, mode, cached: true, costUsd: 0 };
    }
  }

  let data: z.infer<S>;
  let costUsd = 0;
  if (mode === "mock") {
    data = call.schema.parse(call.mock());
    await recordUsage({ playbookId: call.playbookId, operation: call.operation, model, usage: { inputTokens: 0, outputTokens: 0 } });
  } else {
    await assertBudget(estimateCost(model, system.length + call.user.length, call.expectedOutputTokens));
    const message = await anthropic()
      .beta.messages.stream({
        model,
        max_tokens: call.maxTokens,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: call.user }],
        output_config: call.jsonMode === "prompt" ? { effort: cfg.effort[call.role] } : { effort: cfg.effort[call.role], format: betaZodOutputFormat(call.schema) },
      })
      .finalMessage();
    const u = message.usage;
    costUsd = await recordUsage({
      playbookId: call.playbookId,
      operation: call.operation,
      model: message.model ?? model,
      usage: { inputTokens: u.input_tokens, outputTokens: u.output_tokens, cacheReadTokens: u.cache_read_input_tokens ?? 0, cacheWriteTokens: u.cache_creation_input_tokens ?? 0 },
    });
    if (message.stop_reason === "refusal") throw new AiOutputError("We couldn’t write a playbook for that request. Try describing the product differently.");
    if (message.stop_reason === "max_tokens") throw new AiOutputError("The playbook was cut off before it finished. Please try again.");
    const text = message.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    let json: unknown;
    try {
      json = call.jsonMode === "prompt" ? extractJson(text) : JSON.parse(text);
    } catch {
      throw new AiOutputError("The playbook came back in an unexpected format. Please try again.");
    }
    const parsed = call.schema.safeParse(json);
    if (!parsed.success) throw new AiOutputError(`The playbook failed validation (${parsed.error.issues[0]?.message ?? "unknown"}). Please try again.`);
    data = parsed.data;
  }

  await db
    .insert(schema.llmCache)
    .values({ key, operation: call.operation, output: data as object })
    .onConflictDoUpdate({ target: schema.llmCache.key, set: { output: data as object, createdAt: new Date() } });
  return { data, model, mode, cached: false, costUsd };
}
