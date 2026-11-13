/**
 * Search providers. Only PUBLIC query strings ever reach a provider — queries
 * are built from the product name and audience, never from the private
 * description or uploaded documents.
 */
import { getConfig } from "@/lib/config";
import { assertBudget, estimateCost, recordUsage } from "@/lib/cost/budget";
import { anthropic } from "@/lib/ai/client";

export type SearchHit = { title: string; url: string; excerpt: string; publisher: string | null; publishedAt: string | null };

export class ResearchUnavailableError extends Error {}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Tavily: one HTTP call per query; free tier ≈ 1,000 searches/month. */
export async function tavilySearch(query: string, maxResults: number): Promise<SearchHit[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new ResearchUnavailableError("TAVILY_API_KEY is not set.");
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ query, max_results: maxResults, search_depth: "basic" }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new ResearchUnavailableError(`Search failed (${res.status}).`);
  const json = (await res.json()) as { results?: { title: string; url: string; content: string; published_date?: string }[] };
  return (json.results ?? []).map((r) => ({ title: r.title, url: r.url, excerpt: r.content, publisher: host(r.url), publishedAt: r.published_date ?? null }));
}

/**
 * Anthropic web search on the cheap research model. Uses the basic search tool
 * because it returns cited passages (URL + quote); we keep only those, so no
 * link can be invented. (The dynamic-filtering variant returns uncited prose.)
 */
export async function anthropicSearch(queries: string[], topic: string, instruction: string, playbookId: string | null): Promise<SearchHit[]> {
  const cfg = getConfig();
  const model = cfg.models.research;
  const maxUses = cfg.research.anthropicMaxUses;
  await assertBudget(estimateCost(model, 25_000, 2_000, maxUses));
  const msg = await anthropic()
    .beta.messages.stream({
      model,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: cfg.effort.research },
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: maxUses }],
      messages: [
        {
          role: "user",
          content: `Research for a marketing plan (${topic}).\nGoal: ${instruction}\nUseful searches to start from (adapt as needed):\n${queries.map((q, i) => `${i + 1}. ${q}`).join("\n")}\nPrefer specific pages (a campaign, video, post, show, channel, newsletter or community page) over homepages. Write short factual findings; cite a search result in every sentence.`,
        },
      ],
    })
    .finalMessage();
  await recordUsage({
    playbookId,
    operation: `research:${topic}`,
    model,
    usage: {
      inputTokens: msg.usage.input_tokens,
      outputTokens: msg.usage.output_tokens,
      cacheReadTokens: msg.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: msg.usage.cache_creation_input_tokens ?? 0,
      webSearches: msg.usage.server_tool_use?.web_search_requests ?? 0,
    },
  });
  const age = new Map<string, string | null>();
  for (const b of msg.content) if (b.type === "web_search_tool_result" && Array.isArray(b.content)) for (const r of b.content) if (r.type === "web_search_result") age.set(r.url, r.page_age ?? null);
  const hits: SearchHit[] = [];
  for (const b of msg.content) {
    if (b.type !== "text" || !b.citations) continue;
    for (const c of b.citations) if (c.type === "web_search_result_location") hits.push({ title: c.title ?? c.url, url: c.url, excerpt: c.cited_text, publisher: host(c.url), publishedAt: age.get(c.url) ?? null });
  }
  return hits;
}
