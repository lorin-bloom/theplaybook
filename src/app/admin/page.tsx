import Link from "next/link";
import { desc, eq, gte, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { monthSpend, monthStart } from "@/lib/cost/budget";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — The Playbook", robots: { index: false } };

const usd = (n: number) => (n < 0.01 && n > 0 ? "<$0.01" : `$${n.toFixed(2)}`);

export default async function Admin() {
  const cfg = getConfig();
  const db = await getDb();
  const [spend, recent, [counts], byOp] = await Promise.all([
    monthSpend(),
    db.select().from(schema.playbooks).where(eq(schema.playbooks.isExample, false)).orderBy(desc(schema.playbooks.createdAt)).limit(50),
    db
      .select({ month: sql<number>`count(*)`, done: sql<number>`sum(case when ${schema.playbooks.status} = 'done' then 1 else 0 end)` })
      .from(schema.playbooks)
      .where(gte(schema.playbooks.createdAt, monthStart())),
    db
      .select({ op: schema.usageEvents.operation, model: schema.usageEvents.model, n: sql<number>`count(*)`, cost: sql<number>`sum(${schema.usageEvents.costUsd})`, searches: sql<number>`sum(${schema.usageEvents.webSearches})` })
      .from(schema.usageEvents)
      .where(gte(schema.usageEvents.createdAt, monthStart()))
      .groupBy(schema.usageEvents.operation, schema.usageEvents.model),
  ]);
  const done = Number(counts?.done ?? 0);
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10 text-sm">
      <h1 className="font-serif text-3xl">Admin</h1>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Spend this month" value={`${usd(spend)} / ${usd(cfg.limits.monthlyBudgetUsd)}`} />
        <Stat label="Playbooks this month" value={`${done} done / ${Number(counts?.month ?? 0)} started`} />
        <Stat label="Avg cost per playbook" value={done ? usd(spend / done) : "—"} />
        <Stat label="Caps" value={`${cfg.limits.perVisitorPerDay}/visitor/day · ${cfg.limits.perDay}/day`} />
      </div>
      <p className="text-slate-500">
        Playbook model <b>{cfg.models.playbook}</b> ({cfg.effort.playbook} effort) · research{" "}
        <b>{cfg.researchProvider === "tavily" ? "Tavily" : cfg.researchProvider === "anthropic" ? cfg.models.research : "off"}</b> · AI mode {cfg.aiMode}
      </p>
      <table className="w-full text-left">
        <thead className="text-xs text-slate-500">
          <tr><th className="py-1">Operation</th><th>Model</th><th>Calls</th><th>Searches</th><th className="text-right">Cost</th></tr>
        </thead>
        <tbody>
          {byOp.map((o, i) => (
            <tr key={i} className="border-t">
              <td className="py-1.5">{o.op}</td><td className="font-mono text-xs">{o.model}</td><td>{Number(o.n)}</td><td>{Number(o.searches)}</td><td className="text-right">{usd(Number(o.cost))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="w-full text-left">
        <thead className="text-xs text-slate-500">
          <tr><th className="py-1">When (UTC)</th><th>Product</th><th>Status</th><th className="text-right">Cost</th></tr>
        </thead>
        <tbody>
          {recent.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="py-1.5 text-xs text-slate-500">{p.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
              <td><Link className="text-indigo-700 hover:underline" href={`/p/${p.id}`}>{p.inputs.product}</Link></td>
              <td>{p.status}{p.error ? ` — ${p.error}` : ""}</td>
              <td className="text-right">{usd(p.costUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
