/**
 * Wallet protection for a public, no-sign-up tool:
 * - per-visitor daily cap (visitor = salted hash of IP; the IP is never stored).
 *   Failed playbooks don't count against anyone; their cost still counts toward the budget.
 * - global daily cap
 * - monthly budget hard stop (checked again before every paid call)
 */
import { and, count, eq, gte, ne } from "drizzle-orm";
import { getConfig } from "@/lib/config";
import { getDb, schema } from "@/lib/db";
import { monthSpend } from "@/lib/cost/budget";
import { sha256 } from "@/lib/util/hash";

export class LimitError extends Error {}

/** Typical worst-case cost of one playbook, used as headroom for the budget check. */
export const EXPECTED_PLAYBOOK_COST_USD = 0.2;

export function visitorId(headers: Headers): string {
  const ip = headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return sha256(`${getConfig().hashSalt}:${ip}`).slice(0, 32);
}

function todayStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function checkLimits(visitor: string) {
  const cfg = getConfig();
  const db = await getDb();
  const since = todayStart();
  const [mine] = await db
    .select({ n: count() })
    .from(schema.playbooks)
    .where(and(eq(schema.playbooks.visitor, visitor), eq(schema.playbooks.isExample, false), ne(schema.playbooks.status, "error"), gte(schema.playbooks.createdAt, since)));
  if (Number(mine.n) >= cfg.limits.perVisitorPerDay) {
    throw new LimitError(`You’ve made ${cfg.limits.perVisitorPerDay} playbooks today — that’s the daily limit. Come back tomorrow, or explore an example playbook.`);
  }
  const [all] = await db.select({ n: count() }).from(schema.playbooks).where(and(eq(schema.playbooks.isExample, false), ne(schema.playbooks.status, "error"), gte(schema.playbooks.createdAt, since)));
  if (Number(all.n) >= cfg.limits.perDay) {
    throw new LimitError("The Playbook has hit its daily limit. Please try again tomorrow, or explore an example playbook.");
  }
  if ((await monthSpend()) + EXPECTED_PLAYBOOK_COST_USD > cfg.limits.monthlyBudgetUsd) {
    throw new LimitError("The Playbook has reached its usage limit for this month. Explore an example playbook in the meantime.");
  }
}
