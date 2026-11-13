/**
 * Research for one playbook, in three purpose-built batches:
 *   market   — product facts, competitors, audience problems (facts only)
 *   examples — real marketing BY competitors and adjacent brands (campaigns,
 *              launch videos, ads, posts) — never articles about the product
 *   people   — independent creators, podcasts, newsletters, communities and
 *              publications the audience follows — never the company's own staff
 * The strategy is written as if none of its marketing exists yet: product FACTS
 * may come from anywhere, but pages about the product itself (its own campaigns,
 * reviews, creator videos, press) can never serve as examples, collaborators or
 * media — such hits are re-filed under "market" (facts only).
 * Each source keeps its topic so the writer (and code) can use it only where
 * it belongs. Results are cached and shared across playbooks.
 */
import { eq } from "drizzle-orm";
import { getConfig } from "@/lib/config";
import { getDb, schema } from "@/lib/db";
import type { PlaybookInputs, PlaybookSource } from "@/lib/playbook/schema";
import { hashOf } from "@/lib/util/hash";
import { anthropicSearch, tavilySearch, type SearchHit } from "./providers";

export type ResearchTopicKey = "market" | "examples" | "people";
export type ResearchTopic = { topic: ResearchTopicKey; label: string; instruction: string; queries: string[] };

/** Builds research batches from PUBLIC inputs only (product + audience). Never the description or documents. */
export function planQueries(inputs: Pick<PlaybookInputs, "product" | "audience">): ResearchTopic[] {
  const product = inputs.product.trim();
  const audience = inputs.audience.trim();
  const who = audience || `the people ${product} is for`;
  return [
    {
      topic: "market",
      label: "Researching the market",
      instruction: `Facts about ${product}: what it is, who makes it, features, pricing, and its main competitors. Also the biggest problems ${who} face. Prefer official and reputable sources.`,
      queries: [`${product} what it is pricing`, `${product} competitors`, `${who} biggest challenges`],
    },
    {
      topic: "examples",
      label: "Finding competitor campaigns",
      instruction: `First identify ${product}'s main competitors and adjacent brands. Then find SPECIFIC marketing made BY those brands — ad campaigns, launch videos, brand films, social posts, creator collaborations — and cite the campaign page, the video, or press coverage of that campaign. Do NOT cite reviews, explainers, guides or "alternatives" articles about ${product}, and do not cite ${product}'s own website.`,
      queries: [`${product} competitors ad campaign`, `${product} competitor launch video brand campaign`],
    },
    {
      topic: "people",
      label: "Finding creators, podcasts and press",
      instruction: `Find independent creators, podcasts, newsletters, online communities and publications that ${who} follow for this category — for example tech and startup podcasts, YouTube creators, newsletters. Cite their show, channel, newsletter or community page (not an episode or article about ${product}). EXCLUDE ${product}'s own company: its founders, executives, employees and investors.`,
      queries: [`best podcasts and YouTube creators for ${who}`, `newsletters and communities for ${who}`],
    },
  ];
}

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** True when a page's title or URL is about the product itself (full name, or its distinctive last word). */
export function isAboutProduct(hit: Pick<SearchHit, "title" | "url">, product: string): boolean {
  const hay = ` ${words(`${hit.title} ${hit.url}`)} `;
  const name = words(product);
  if (!name) return false;
  if (hay.includes(` ${name} `) || hay.includes(` ${name.replace(/ /g, "")} `)) return true;
  const last = name.split(" ").pop()!;
  return name.includes(" ") && last.length >= 4 && hay.includes(` ${last} `);
}

const normalizeUrl = (u: string) => u.replace(/#.*$/, "").replace(/[?&]utm_[^&]+/g, "").replace(/\/$/, "");
const PER_TOPIC = 8;

export async function research(inputs: PlaybookInputs, playbookId: string | null, log: (m: string) => Promise<void> | void): Promise<{ sources: PlaybookSource[]; limitations: string[] }> {
  const cfg = getConfig();
  const limitations: string[] = [];
  if (cfg.aiMode === "mock") return { sources: [], limitations: ["Development mock mode: no web research."] };
  if (cfg.researchProvider === "none") return { sources: [], limitations: ["Web research is not configured; the playbook relies on your description."] };

  const db = await getDb();
  const byUrl = new Map<string, SearchHit & { topic: ResearchTopicKey }>();
  for (const t of planQueries(inputs)) {
    await log(t.label);
    const key = hashOf({ provider: cfg.researchProvider, topic: t.topic, instruction: t.instruction, queries: t.queries, n: cfg.research.tavilyResults, u: cfg.research.anthropicMaxUses });
    const [cached] = await db.select().from(schema.researchCache).where(eq(schema.researchCache.key, key));
    let found: SearchHit[];
    if (cached && cached.expiresAt > new Date()) {
      found = cached.payload as SearchHit[];
    } else {
      try {
        found =
          cfg.researchProvider === "tavily"
            ? (await Promise.all(t.queries.map((q) => tavilySearch(q, cfg.research.tavilyResults)))).flat()
            : await anthropicSearch(t.queries, t.topic, t.instruction, playbookId);
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
    // Deduplicate by URL; a page keeps the topic it was first found for. Cap per topic so every bucket is represented.
    let added = 0;
    for (const h of found) {
      // Existing coverage of the product is product knowledge, never an example or collaborator.
      const topic: ResearchTopicKey = t.topic !== "market" && isAboutProduct(h, inputs.product) ? "market" : t.topic;
      const k = normalizeUrl(h.url);
      const prev = byUrl.get(k);
      if (prev) {
        if (prev.topic === topic && h.excerpt.length > prev.excerpt.length) byUrl.set(k, { ...h, topic });
        continue;
      }
      if (added >= PER_TOPIC) continue;
      byUrl.set(k, { ...h, topic });
      added++;
    }
  }

  const sources: PlaybookSource[] = [...byUrl.values()].map((h, i) => ({
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
