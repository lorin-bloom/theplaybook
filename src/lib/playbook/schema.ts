/**
 * The Playbook: one structured report with seven sections, written in a
 * single model call. Every section has a one-line headline for the board view
 * plus compact detail for the expanders (so expanding costs nothing).
 *
 * Citation fields (sourceRefs / exampleRef / inspirationRef / sourceRef) may
 * only contain handles from the research pack ("S1"…); unknown handles are
 * stripped after generation, so links are always real.
 */
import { z } from "zod";

// Tolerant parsing: unexpected enum values fall back to safe defaults instead of failing the playbook.
export const ClaimStatus = z.enum(["verified", "supported", "hypothesis"]).catch("hypothesis");
export const Claim = z.object({ text: z.string(), status: ClaimStatus, sourceRefs: z.array(z.string()) });
export type Claim = z.infer<typeof Claim>;

export const MockKind = z.enum(["social_post", "short_video", "long_video", "email", "article", "event", "podcast", "ad"]).catch("social_post");

export const PlaybookReport = z.object({
  productName: z.string(),
  oneLiner: z.string(),
  opportunity: z.object({
    headline: z.string(),
    audience: z.string(),
    problem: z.string(),
    whyNow: z.string(),
    rationale: z.array(z.string()),
    evidence: z.array(Claim),
  }),
  positioning: z.object({
    valueProposition: z.string(),
    differentiator: z.string(),
    pillars: z.array(z.object({ name: z.string(), line: z.string() })),
    proof: z.array(Claim),
  }),
  bigIdea: z.object({
    campaignName: z.string(),
    hook: z.string(),
    concept: z.string(),
    visualDirection: z.string(),
    example: z.object({ format: z.string(), headline: z.string(), body: z.string(), cta: z.string() }),
    whyItWorks: z.string(),
    steps: z.array(z.string()),
    inspirationRef: z.string().nullable().catch(null),
    inspirationNote: z.string(),
  }),
  channels: z.array(
    z.object({
      platform: z.string(),
      role: z.string(),
      tactic: z.string(),
      format: z.string(),
      audience: z.string(),
      cadence: z.string(),
      kpi: z.string(),
      mock: z.object({ kind: MockKind, headline: z.string(), body: z.string() }),
      exampleRef: z.string().nullable().catch(null),
      exampleNote: z.string(),
      steps: z.array(z.string()),
    }),
  ),
  collaborators: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["partner", "creator", "community", "media"]).catch("partner"),
      why: z.string(),
      activation: z.string(),
      sourceRefs: z.array(z.string()),
    }),
  ),
  story: z.object({
    angle: z.string(),
    whyInteresting: z.string(),
    sampleHeadline: z.string(),
    opportunities: z.array(z.object({ outlet: z.string(), why: z.string(), sourceRef: z.string().nullable().catch(null) })),
    risks: z.array(z.string()),
    evidence: z.array(Claim),
  }),
  gamePlan: z.object({
    actions: z.array(z.object({ action: z.string(), why: z.string() })),
    timeline: z.array(z.object({ when: z.string(), focus: z.string() })),
    kpis: z.array(z.object({ name: z.string(), target: z.string() })),
  }),
  assumptions: z.array(z.string()),
});
export type PlaybookReport = z.infer<typeof PlaybookReport>;

export const PlaybookInputs = z.object({
  product: z.string().trim().min(2, "Tell us what you’re marketing.").max(120),
  about: z.string().trim().max(3000).default(""),
  audience: z.string().trim().max(300).default(""),
  goal: z.string().trim().max(300).default(""),
});
export type PlaybookInputs = z.infer<typeof PlaybookInputs>;

export type PlaybookSource = {
  ref: string;
  title: string;
  url: string | null;
  publisher: string | null;
  publishedAt: string | null;
  excerpt: string;
  origin: "public" | "upload" | "example";
  topic: string;
  /** The page is about the product or its brand family (facts only; never shown in Story). */
  aboutProduct?: boolean;
};
