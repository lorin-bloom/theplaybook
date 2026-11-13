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
export type ResearchTopic = { topic: ResearchTopicKey; label: string; instruction: string; queries: string[]; maxUses: number };

/** Builds research batches from PUBLIC inputs only (product + audience). Never the description or documents. */
export function planQueries(inputs: Pick<PlaybookInputs, "product" | "audience">): ResearchTopic[] {
  const product = inputs.product.trim();
  const audience = inputs.audience.trim();
  const who = audience || `the people ${product} is for`;
  return [
    {
      topic: "market",
      label: "Researching the market",
      instruction: `Facts about ${product}: what it is, who makes it, features, pricing, and its main competitors. Also how the company behind ${product} usually launches products — launch events or livestreams, staged rollouts, waitlists, early access for creators or press, past brand campaigns — so the plan can match its real launch style and scale. Also the biggest problems ${who} face. Prefer official and reputable sources.`,
      queries: [`${product} what it is pricing`, `${product} competitors`, `how does the company behind ${product} launch new products`],
      maxUses: 3,
    },
    {
      topic: "examples",
      label: "Finding competitor campaigns",
      instruction: `Step 1: identify ${product}'s 2–3 main competitors or adjacent brands (NOT ${product}'s own company or brand family). Step 2: search each competitor BY NAME for marketing it made — ad campaigns, launch videos, brand films, social posts, creator collaborations — WITHOUT "${product}" in the query. Cite only pages about a competitor's own campaign (the campaign page, the video, or press coverage of that campaign). Never cite pages about ${product}, its company, reviews, comparisons or "alternatives" articles.`,
      queries: [`${product} main competitors`, `<competitor name> ad campaign`, `<another competitor name> launch video brand campaign`],
      maxUses: 3,
    },
    {
      topic: "people",
      label: "Finding creators, podcasts and press",
      instruction: `Find specific independent creators, podcasts, YouTube channels, newsletters, communities and publications that ${who} follow for this category (e.g. tech and startup podcasts and creators). Step 1: find names. Step 2: search those names and cite THEIR OWN page — the show's website, YouTube channel, podcast page, newsletter or community — never a "best podcasts" list article, and never an episode or article about ${product}. EXCLUDE ${product}'s own company: its founders, executives, employees and investors.`,
      queries: [`top podcasts and YouTube creators for ${who}`, `<show or creator name> podcast`, `<another show or creator name> newsletter OR YouTube`],
      maxUses: 3,
    },
  ];
}

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Generic words that don't identify a brand ("ChatGPT Business", "Notion AI for teams"). */
const GENERIC = new Set(["business", "team", "teams", "enterprise", "plus", "premium", "pro", "free", "for", "with", "and", "app", "apps", "studio", "cloud", "platform", "suite", "work", "labs", "online", "mobile", "sales", "marketing"]);

/**
 * True when a page's title or URL is about the product or its brand family:
 * the full name, or a distinctive word of it (e.g. "ChatGPT" or "Dots" in "ChatGPT Dots").
 */
export function isAboutProduct(hit: Pick<SearchHit, "title" | "url">, product: string): boolean {
  const hay = ` ${words(`${hit.title} ${hit.url}`)} `;
  const name = words(product);
  if (!name) return false;
  if (hay.includes(` ${name} `) || hay.includes(` ${name.replace(/ /g, "")} `)) return true;
  const parts = name.split(" ");
  const distinctive = [...new Set([parts[0], parts[parts.length - 1]])].filter((w) => w.length >= 4 && !GENERIC.has(w));
  // Singular/plural too: "Dots" also matches "dot agents".
  const forms = distinctive.flatMap((w) => [w, w.endsWith("s") ? w.slice(0, -1) : `${w}s`]);
  return forms.some((w) => hay.includes(` ${w} `));
}

/** "9 Best AI Podcasts in 2026", "Top 10 creators…" — a list article, not the creator's own page. */
export function isListicle(title: string): boolean {
  const kinds = "podcasts|creators|youtubers|youtube channels|channels|newsletters|communities|influencers|shows|blogs|accounts";
  return new RegExp(`\\b(best|top|\\d+)\\b.*\\b(${kinds})\\b|\\b(${kinds}) (for|to follow|to watch|to listen)\\b`, "i").test(title);
}

const normalizeUrl = (u: string) => u.replace(/#.*$/, "").replace(/[?&]utm_[^&]+/g, "").replace(/\/$/, "");
const PER_TOPIC = 8;

export async function research(inputs: PlaybookInputs, playbookId: string | null, log: (m: string) => Promise<void> | void): Promise<{ sources: PlaybookSource[]; limitations: string[] }> {
  const cfg = getConfig();
  const limitations: string[] = [];
  if (cfg.aiMode === "mock") return { sources: [], limitations: ["Development mock mode: no web research."] };
  if (cfg.researchProvider === "none") return { sources: [], limitations: ["Web research is not configured; the playbook relies on your description."] };

  const db = await getDb();
  const byUrl = new Map<string, SearchHit & { topic: ResearchTopicKey; aboutProduct: boolean }>();
  for (const t of planQueries(inputs)) {
    await log(t.label);
    const key = hashOf({ provider: cfg.researchProvider, topic: t.topic, instruction: t.instruction, queries: t.queries, n: cfg.research.tavilyResults, u: t.maxUses });
    const [cached] = await db.select().from(schema.researchCache).where(eq(schema.researchCache.key, key));
    let found: SearchHit[];
    if (cached && cached.expiresAt > new Date()) {
      found = cached.payload as SearchHit[];
    } else {
      try {
        found =
          cfg.researchProvider === "tavily"
            ? (await Promise.all(t.queries.filter((q) => !q.includes("<")).map((q) => tavilySearch(q, cfg.research.tavilyResults)))).flat()
            : await anthropicSearch(t.queries, t.topic, t.instruction, playbookId, t.maxUses);
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
      // Existing coverage of the product (or its brand family) is product knowledge, never an example or collaborator.
      const aboutProduct = isAboutProduct(h, inputs.product);
      const topic: ResearchTopicKey = aboutProduct ? "market" : t.topic;
      const k = normalizeUrl(h.url);
      const prev = byUrl.get(k);
      if (prev) {
        if (prev.topic === topic && h.excerpt.length > prev.excerpt.length) byUrl.set(k, { ...h, topic, aboutProduct });
        continue;
      }
      if (added >= PER_TOPIC) continue;
      byUrl.set(k, { ...h, topic, aboutProduct });
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
    aboutProduct: h.aboutProduct,
  }));
  return { sources, limitations };
}
