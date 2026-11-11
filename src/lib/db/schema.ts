import { pgTable, text, integer, boolean, timestamp, jsonb, doublePrecision, index } from "drizzle-orm/pg-core";
import type { PlaybookInputs, PlaybookReport, PlaybookSource } from "@/lib/playbook/schema";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/** One generated playbook. Public by unguessable id; no accounts. */
export const playbooks = pgTable(
  "playbooks",
  {
    id: text("id").primaryKey(),
    /** Hash of normalised inputs + document text + prompt version (dedupe identical requests). */
    inputHash: text("input_hash").notNull(),
    inputs: jsonb("inputs").$type<PlaybookInputs>().notNull(),
    /** Names of uploaded files. File contents are never stored. */
    docNames: jsonb("doc_names").$type<string[]>().notNull().default([]),
    status: text("status").notNull(), // running | done | error
    stage: text("stage"),
    report: jsonb("report").$type<PlaybookReport | null>(),
    sources: jsonb("sources").$type<PlaybookSource[]>().notNull().default([]),
    /** URL → preview image, fetched from public pages (no AI cost). */
    thumbnails: jsonb("thumbnails").$type<Record<string, string>>().notNull().default({}),
    generationMode: text("generation_mode").notNull().default("live"), // live | mock | example
    error: text("error"),
    /** Salted hash of the visitor IP, only for rate limiting. */
    visitor: text("visitor"),
    isExample: boolean("is_example").notNull().default(false),
    costUsd: doublePrecision("cost_usd").notNull().default(0),
    createdAt: createdAt(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [index("playbooks_hash_idx").on(t.inputHash), index("playbooks_visitor_idx").on(t.visitor), index("playbooks_created_idx").on(t.createdAt)],
);

/** Cross-playbook cache for PUBLIC research only. */
export const researchCache = pgTable("research_cache", {
  key: text("key").primaryKey(),
  provider: text("provider").notNull(),
  query: text("query").notNull(),
  payload: jsonb("payload").$type<unknown>().notNull(),
  createdAt: createdAt(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/** Cache of model outputs keyed by a hash of (operation, model, prompt version, inputs). */
export const llmCache = pgTable("llm_cache", {
  key: text("key").primaryKey(),
  operation: text("operation").notNull(),
  output: jsonb("output").$type<unknown>().notNull(),
  createdAt: createdAt(),
});

export const usageEvents = pgTable(
  "usage_events",
  {
    id: text("id").primaryKey(),
    playbookId: text("playbook_id"),
    operation: text("operation").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    cacheReadTokens: integer("cache_read_tokens").notNull().default(0),
    cacheWriteTokens: integer("cache_write_tokens").notNull().default(0),
    webSearches: integer("web_searches").notNull().default(0),
    costUsd: doublePrecision("cost_usd").notNull().default(0),
    cached: boolean("cached").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("usage_playbook_idx").on(t.playbookId), index("usage_created_idx").on(t.createdAt)],
);

export type PlaybookRow = typeof playbooks.$inferSelect;
export type UsageEvent = typeof usageEvents.$inferSelect;
