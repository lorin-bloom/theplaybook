/**
 * Runtime configuration, all from environment variables. Defaults are tuned
 * for a public, no-sign-up portfolio tool: cheap research, one high-quality
 * writing call per playbook, and hard spending caps.
 */
import "server-only";

export type AiMode = "live" | "mock" | "off";
export type ResearchProvider = "tavily" | "anthropic" | "none";
export type ModelRole = "research" | "playbook";
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

/** Env var, treating blank values (e.g. `MODEL_PLAYBOOK=` copied from .env.example) as unset. */
function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}

function num(name: string, fallback: number): number {
  const raw = env(name);
  const n = Number(raw);
  return raw !== undefined && Number.isFinite(n) ? n : fallback;
}

export function getConfig() {
  const hasAnthropicKey = Boolean(env("ANTHROPIC_API_KEY") || env("ANTHROPIC_AUTH_TOKEN"));
  const requestedMode = (env("AI_MODE") ?? "").toLowerCase();
  const aiMode: AiMode = requestedMode === "mock" ? "mock" : requestedMode === "off" ? "off" : hasAnthropicKey ? "live" : "off";

  // Tavily's free tier makes research effectively free; prefer it when configured.
  const requested = (env("RESEARCH_PROVIDER") ?? "").toLowerCase();
  let researchProvider: ResearchProvider = "none";
  if (requested === "none") researchProvider = "none";
  else if ((requested === "tavily" || requested === "") && env("TAVILY_API_KEY")) researchProvider = "tavily";
  else if ((requested === "anthropic" || requested === "") && aiMode === "live") researchProvider = "anthropic";

  return {
    aiMode,
    researchProvider,
    models: {
      // Cheap model that runs the web-search tool when Tavily isn't configured.
      research: env("MODEL_RESEARCH") ?? "claude-haiku-5-5",
      // The single call that writes the whole playbook.
      playbook: env("MODEL_PLAYBOOK") ?? "claude-sonnet-5-5",
    } satisfies Record<ModelRole, string>,
    effort: {
      research: (env("EFFORT_RESEARCH") ?? "low") as Effort,
      playbook: (env("EFFORT_PLAYBOOK") ?? "medium") as Effort,
    } satisfies Record<ModelRole, Effort>,
    research: {
      /** Searches per research call when using Anthropic web search (2 calls per playbook). */
      anthropicMaxUses: num("RESEARCH_MAX_USES", 2),
      /** Results per query when using Tavily. */
      tavilyResults: num("TAVILY_RESULTS", 4),
      cacheDays: num("RESEARCH_CACHE_DAYS", 14),
    },
    limits: {
      perVisitorPerDay: num("PLAYBOOKS_PER_VISITOR_PER_DAY", 3),
      perDay: num("PLAYBOOKS_PER_DAY", 40),
      monthlyBudgetUsd: num("MONTHLY_BUDGET_USD", 15),
    },
    uploads: {
      maxFiles: 3,
      // Vercel rejects request bodies over 4.5 MB, so cap attachments at 4 MB in total.
      maxTotalBytes: num("MAX_UPLOAD_BYTES", 4 * 1024 * 1024),
      /** Total document text sent to the model (~10k tokens). */
      maxDocChars: num("MAX_DOC_CHARS", 40_000),
    },
    adminPassword: env("ADMIN_PASSWORD") ?? "",
    hashSalt: env("HASH_SALT") ?? "the-playbook-local-salt",
  };
}

/** USD per million tokens (estimates for budgeting). Override with MODEL_PRICING_JSON. */
const DEFAULT_PRICING: Record<string, { input: number; output: number; cacheRead?: number }> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
};

export function getPricing(model: string) {
  let overrides: Record<string, { input: number; output: number; cacheRead?: number }> = {};
  try {
    overrides = process.env.MODEL_PRICING_JSON ? JSON.parse(process.env.MODEL_PRICING_JSON) : {};
  } catch {
    overrides = {};
  }
  return overrides[model] ?? DEFAULT_PRICING[model] ?? { input: 5, output: 25, cacheRead: 0.5 };
}

/** Per web search request (Anthropic server tool), USD. */
export const WEB_SEARCH_COST_USD = num("WEB_SEARCH_COST_USD", 0.01);
