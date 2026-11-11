/**
 * Cost accounting and the global spending cap. Every paid call checks
 * `assertBudget` before it is made and records its usage afterwards.
 */
import { gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getConfig, getPricing, WEB_SEARCH_COST_USD } from "@/lib/config";
import { newId } from "@/lib/util/hash";

export class BudgetExceededError extends Error {
  constructor() {
    super("The Playbook has reached its usage limit for now. Please try again later, or explore an example playbook.");
  }
}

export type TokenUsage = { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheWriteTokens?: number; webSearches?: number };

export function costFor(model: string, u: TokenUsage): number {
  const p = getPricing(model);
  const cacheRead = p.cacheRead ?? p.input * 0.1;
  return (
    (u.inputTokens * p.input + u.outputTokens * p.output + (u.cacheReadTokens ?? 0) * cacheRead + (u.cacheWriteTokens ?? 0) * p.input * 1.25) / 1_000_000 +
    (u.webSearches ?? 0) * WEB_SEARCH_COST_USD
  );
}

export function estimateCost(model: string, inputChars: number, expectedOutputTokens: number, webSearches = 0) {
  return costFor(model, { inputTokens: Math.ceil(inputChars / 4), outputTokens: expectedOutputTokens, webSearches });
}

export function monthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function monthSpend(): Promise<number> {
  const db = await getDb();
  const [r] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.usageEvents.costUsd}), 0)` })
    .from(schema.usageEvents)
    .where(gte(schema.usageEvents.createdAt, monthStart()));
  return Number(r.total);
}

/** Hard stop: throws before any paid call that would exceed the monthly budget. */
export async function assertBudget(estimateUsd: number) {
  if ((await monthSpend()) + estimateUsd > getConfig().limits.monthlyBudgetUsd) throw new BudgetExceededError();
}

export async function recordUsage(e: { playbookId: string | null; operation: string; model: string; usage: TokenUsage; cached?: boolean }) {
  const db = await getDb();
  const costUsd = e.cached ? 0 : costFor(e.model, e.usage);
  await db.insert(schema.usageEvents).values({
    id: newId("u_"),
    playbookId: e.playbookId,
    operation: e.operation,
    model: e.model,
    inputTokens: e.usage.inputTokens,
    outputTokens: e.usage.outputTokens,
    cacheReadTokens: e.usage.cacheReadTokens ?? 0,
    cacheWriteTokens: e.usage.cacheWriteTokens ?? 0,
    webSearches: e.usage.webSearches ?? 0,
    costUsd,
    cached: Boolean(e.cached),
  });
  return costUsd;
}
