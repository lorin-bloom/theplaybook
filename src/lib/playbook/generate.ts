/**
 * Playbook pipeline. Cost-shaped by design:
 *   1. research (Tavily free tier, or the cheap model + ~4 searches; cached)
 *   2. ONE writing call on the strategy model produces the whole report,
 *      including the expandable details — no follow-up calls
 *   3. provenance check (links can only point at real research results)
 *   4. link-preview thumbnails fetched from public pages (no AI cost)
 * Identical requests are deduplicated and served from the saved playbook.
 */
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getConfig } from "@/lib/config";
import { getDb, schema } from "@/lib/db";
import { callStructured, AiNotConfiguredError, AiOutputError } from "@/lib/ai/client";
import { BudgetExceededError } from "@/lib/cost/budget";
import { research } from "@/lib/research/research";
import { wrapUntrusted } from "@/lib/security/injection";
import { hashOf, newId } from "@/lib/util/hash";
import { PlaybookReport, type PlaybookInputs, type PlaybookSource } from "./schema";
import { PLAYBOOK_PROMPT_VERSION, PLAYBOOK_SYSTEM } from "./prompt";
import { enforceProvenance } from "./provenance";
import { fetchThumbnails } from "./thumbnails";
import { checkLimits } from "./limits";
import { mockPlaybook } from "./mock";

export type UploadedDoc = { name: string; text: string };

export function inputHash(inputs: PlaybookInputs, docs: UploadedDoc[]) {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return hashOf({ pv: PLAYBOOK_PROMPT_VERSION, p: norm(inputs.product), a: norm(inputs.about), u: norm(inputs.audience), g: norm(inputs.goal), d: docs.map((d) => hashOf(d.text)).sort() });
}

export function friendlyError(e: unknown): string {
  if (e instanceof BudgetExceededError || e instanceof AiNotConfiguredError || e instanceof AiOutputError) return e.message;
  const err = e as { status?: number };
  if (err?.status === 429) return "We’re a little busy right now. Please try again in a minute.";
  if (err?.status && err.status >= 500) return "The AI service had a temporary problem. Please try again.";
  return "Something went wrong while writing your playbook. Please try again.";
}

/** Creates (or reuses) a playbook and starts generation in the background. */
/**
 * `schedule` runs the pipeline after the response is sent. On Vercel the API
 * route passes Next's `after()`, which keeps the function alive until it ends.
 */
export async function createPlaybook(
  inputs: PlaybookInputs,
  docs: UploadedDoc[],
  visitor: string,
  schedule: (task: () => Promise<void>) => void = (task) => void task(),
): Promise<{ id: string; reused: boolean }> {
  const db = await getDb();
  const hash = inputHash(inputs, docs);
  const [existing] = await db
    .select({ id: schema.playbooks.id, status: schema.playbooks.status })
    .from(schema.playbooks)
    .where(and(eq(schema.playbooks.inputHash, hash), gte(schema.playbooks.createdAt, new Date(Date.now() - 30 * 86_400_000)), sql`${schema.playbooks.status} <> 'error'`))
    .orderBy(desc(schema.playbooks.createdAt))
    .limit(1);
  if (existing) return { id: existing.id, reused: true }; // free: same inputs, same playbook

  await checkLimits(visitor);
  const id = newId("").slice(0, 14);
  await db.insert(schema.playbooks).values({ id, inputHash: hash, inputs, docNames: docs.map((d) => d.name), status: "running", stage: "Starting", visitor });
  schedule(() => runPipeline(id, inputs, docs));
  return { id, reused: false };
}

async function setStage(id: string, stage: string) {
  const db = await getDb();
  await db.update(schema.playbooks).set({ stage }).where(eq(schema.playbooks.id, id));
}

export function buildUserMessage(inputs: PlaybookInputs, docs: UploadedDoc[], sources: PlaybookSource[], maxDocChars: number) {
  let budget = maxDocChars;
  const docBlocks = docs.map((d, i) => {
    const text = d.text.slice(0, Math.max(0, budget));
    budget -= text.length;
    const note = text.length < d.text.length ? `\n[Document truncated: first ${text.length.toLocaleString()} characters used]` : "";
    return wrapUntrusted("document", `U${i + 1}`, `${d.name}\n${text}${note}`);
  });
  const sourceBlocks = sources
    .filter((s) => s.origin === "public")
    .map((s) => wrapUntrusted("source", s.ref, `${s.title} — ${s.publisher ?? ""}${s.publishedAt ? `, ${s.publishedAt}` : ""}\nurl: ${s.url}\n${s.excerpt}`));
  return [
    `# What we're marketing\nProduct: ${inputs.product}`,
    inputs.about && `About it (from the user):\n${wrapUntrusted("user_note", "about", inputs.about)}`,
    `Who it's for: ${inputs.audience || "(not specified — infer the strongest audience and say so in assumptions)"}`,
    `Goal: ${inputs.goal || "(not specified — assume growing adoption and say so in assumptions)"}`,
    docBlocks.length ? `# Uploaded materials (the company's own claims; cite as U1, U2…)\n${docBlocks.join("\n")}` : "",
    `# Research sources (cite by handle)\n${sourceBlocks.join("\n") || "No research available — mark claims as hypothesis and set example links to null."}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function runPipeline(id: string, inputs: PlaybookInputs, docs: UploadedDoc[]) {
  const db = await getDb();
  const cfg = getConfig();
  try {
    const { sources: found } = await research(inputs, id, (m) => setStage(id, m));
    const uploads: PlaybookSource[] = docs.map((d, i) => ({ ref: `U${i + 1}`, title: d.name, url: null, publisher: "Your document", publishedAt: null, excerpt: d.text.slice(0, 300), origin: "upload", topic: "upload" }));
    const sources = [...found, ...uploads];

    await setStage(id, "Writing your playbook");
    const res = await callStructured({
      operation: "playbook",
      role: "playbook",
      schema: PlaybookReport,
      promptVersion: PLAYBOOK_PROMPT_VERSION,
      system: PLAYBOOK_SYSTEM,
      user: buildUserMessage(inputs, docs, sources, cfg.uploads.maxDocChars),
      playbookId: id,
      maxTokens: 16_000,
      expectedOutputTokens: 4_000,
      mock: () => mockPlaybook(inputs),
      // The 7-section schema is too large for strict structured outputs; a tool call
      // still guarantees valid JSON (and keeps this to a single call).
      jsonMode: "tool",
      toolName: "write_playbook",
    });
    const { content: report } = enforceProvenance(res.data, sources.map((s) => s.ref));

    await setStage(id, "Adding real examples");
    const byRef = new Map(sources.map((s) => [s.ref, s]));
    const linked = [report.bigIdea.inspirationRef, ...report.channels.map((c) => c.exampleRef), ...report.collaborators.flatMap((c) => c.sourceRefs.slice(0, 1)), ...report.story.opportunities.map((o) => o.sourceRef)]
      .map((r) => (r ? byRef.get(r)?.url : null))
      .filter((u): u is string => Boolean(u));
    const thumbnails = res.mode === "mock" ? {} : await fetchThumbnails(linked);

    const [{ total }] = await db
      .select({ total: sql<number>`coalesce(sum(${schema.usageEvents.costUsd}), 0)` })
      .from(schema.usageEvents)
      .where(eq(schema.usageEvents.playbookId, id));
    await db
      .update(schema.playbooks)
      .set({ status: "done", stage: null, report, sources, thumbnails, generationMode: res.mode, costUsd: Number(total), finishedAt: new Date() })
      .where(eq(schema.playbooks.id, id));
  } catch (e) {
    console.error(`[playbook ${id}]`, e);
    await db.update(schema.playbooks).set({ status: "error", stage: null, error: friendlyError(e), finishedAt: new Date() }).where(eq(schema.playbooks.id, id));
  }
}

export async function getPlaybook(id: string) {
  if (!/^[\w-]{4,40}$/.test(id)) return null;
  const db = await getDb();
  const [row] = await db.select().from(schema.playbooks).where(eq(schema.playbooks.id, id));
  if (!row) return null;
  // A job interrupted by a server restart would otherwise spin forever.
  if (row.status === "running" && Date.now() - row.createdAt.getTime() > 10 * 60_000) {
    await db.update(schema.playbooks).set({ status: "error", error: "This playbook didn’t finish. Please try again." }).where(eq(schema.playbooks.id, id));
    return { ...row, status: "error", error: "This playbook didn’t finish. Please try again." };
  }
  return row;
}
