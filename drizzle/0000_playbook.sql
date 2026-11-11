CREATE TABLE "llm_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"operation" text NOT NULL,
	"output" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playbooks" (
	"id" text PRIMARY KEY NOT NULL,
	"input_hash" text NOT NULL,
	"inputs" jsonb NOT NULL,
	"doc_names" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text NOT NULL,
	"stage" text,
	"report" jsonb,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"thumbnails" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generation_mode" text DEFAULT 'live' NOT NULL,
	"error" text,
	"visitor" text,
	"is_example" boolean DEFAULT false NOT NULL,
	"cost_usd" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "research_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"query" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"playbook_id" text,
	"operation" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cache_read_tokens" integer DEFAULT 0 NOT NULL,
	"cache_write_tokens" integer DEFAULT 0 NOT NULL,
	"web_searches" integer DEFAULT 0 NOT NULL,
	"cost_usd" double precision DEFAULT 0 NOT NULL,
	"cached" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "playbooks_hash_idx" ON "playbooks" USING btree ("input_hash");--> statement-breakpoint
CREATE INDEX "playbooks_visitor_idx" ON "playbooks" USING btree ("visitor");--> statement-breakpoint
CREATE INDEX "playbooks_created_idx" ON "playbooks" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "usage_playbook_idx" ON "usage_events" USING btree ("playbook_id");--> statement-breakpoint
CREATE INDEX "usage_created_idx" ON "usage_events" USING btree ("created_at");