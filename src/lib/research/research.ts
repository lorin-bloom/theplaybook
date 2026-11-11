/**
 * Research for one playbook: two topic batches (market, marketing & media),
 * served from a shared cache when the same public queries were run recently.
 * Returns a compact, deduplicated, citable source pack.
 */
import { eq } from "drizzle-orm";
import { getConfig } from "@/lib/config";
import { getDb, schema } from "@/lib/db";
import type { PlaybookInputs, PlaybookSource } from "@/lib/playbook/schema";
import { hashOf } from "@/lib/util/hash";
import { anthropicSearch, tavilySearch, type SearchHit } from "./providers";

export type ResearchTopic = { topic: string; queries: string[] };

/** Builds queries from PUBLIC inputs only (product + audience). Never the description or documents. */
export function planQueries(inputs: Pick<PlaybookInputs, "product" | "audience">): ResearchTopic[] {
  const product = inputs.product.trim();
  const audience = inputs.audience.trim() || "its customers";
  return [
    { topic: "market", queries: [`${product} product overview pricing customers`, `${product} competitors alternatives`, `${audience} biggest challenges`] },
    { topic: "marketing", queries: [`${product} marketing campaign examples`, `${audience} popular creators podcasts communities`, `${product} news coverage`] },
  ];
}

const normalizeUrl = (u: string) => u.replace(/#.*$/, "").replace(/[?&]utm_[^&]+/g, "").replace(/\/$/, "");

export async function research(inputs: PlaybookInputs, playbookId: string | null, log: (m: string) => Promise<void> | void): Promise<{ sources: PlaybookSource[]; limitations: string[] }> {
  const cfg = getConfig();
  const limitations: string[] = [];
  if (cfg.aiMode === "mock") return { sources: [], limitations: ["Development mock mode: no web research."] };
  if (cfg.researchProvider === "none") return { sources: [], limitations: ["Web research is not configured; the playbook relies on your description."] };

  const db = await getDb();
  const hits: (SearchHit & { topic: string })[] = [];
  for (const t of planQueries(inputs)) {
    await log(t.topic === "market" ? "Researching the market" : "Finding campaigns, creators and press");
    const key = hashOf({ provider: cfg.researchProvider, queries: t.queries, n: cfg.research.tavilyResults, u: cfg.research.anthropicMaxUses });
    const [cached] = await db.select().from(schema.researchCache).where(eq(schema.researchCache.key, key));
    let found: SearchHit[];
    if (cached && cached.expiresAt > new Date()) {
      found = cached.payload as SearchHit[];
    } else {
      try {
        found =
          cfg.researchProvider === "tavily"
            ? (await Promise.all(t.queries.map((q) => tavilySearch(q, cfg.research.tavilyResults)))).flat()
            : await anthropicSearch(t.queries, t.topic, playbookId);
      } catch (e) {
        limitations.push(`Some research failed: ${(e as Error).message}`);
        found = [];
      }
      const expiresAt = new Date(Date.now() + cfg.research.cacheDays * 86_400_000);
      await db
        .insert(schema.researchCache)
        .values({ key, provider: cfg.researchProvider, query: t.queries.join(" | "), payload: found, expiresAt })
        .onConflictDoUpdate({ target: schema.researchCache.key, set: { payload: found, expiresAt, createdAt: new Date() } });
    }
    hits.push(...found.map((h) => ({ ...h, topic: t.topic })));
  }

  // Deduplicate by URL (keep the longest excerpt), cap the pack to keep the writing call small.
  const byUrl = new Map<string, SearchHit & { topic: string }>();
  for (const h of hits) {
    const k = normalizeUrl(h.url);
    const prev = byUrl.get(k);
    if (!prev || h.excerpt.length > prev.excerpt.length) byUrl.set(k, h);
  }
  const sources: PlaybookSource[] = [...byUrl.values()].slice(0, 24).map((h, i) => ({
    ref: `S${i + 1}`,
    title: h.title.slice(0, 200),
    url: h.url,
    publisher: h.publisher,
    publishedAt: h.publishedAt,
    excerpt: h.excerpt.replace(/\s+/g, " ").trim().slice(0, 450),
    origin: "public",
    topic: h.topic,
  }));
  return { sources, limitations };
}
