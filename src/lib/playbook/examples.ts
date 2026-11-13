/**
 * Pre-made example playbooks — served at zero AI cost so most visitors can
 * explore without generating. Curated from public sources (see
 * exampleSources.ts); independent concept, not affiliated with the company.
 */
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { PlaybookReport, PlaybookSource } from "./schema";
import { DEMO_SOURCES } from "./exampleSources";
import { fetchThumbnails } from "./thumbnails";

export const EXAMPLE_VERSION = "example-v2";

/** Which research bucket each example source belongs to (same rules as generated playbooks). */
const EXAMPLE_TOPICS: Record<string, string> = { S13: "examples", S14: "examples", S15: "examples", S4: "people", S11: "people", S16: "people", S17: "people" };

const v = (text: string, ...sourceRefs: string[]) => ({ text, status: "verified" as const, sourceRefs });

const chatgptBusiness: PlaybookReport = {
  productName: "ChatGPT Business",
  oneLiner: "A shared, secure ChatGPT workspace for teams of 2–200.",
  opportunity: {
    headline: "Turn the scattered personal ChatGPT use already inside small companies into one shared team workspace — before bundled AI becomes the default.",
    audience: "Owner-operators and ops leads at 10–100 person knowledge-work businesses",
    problem: "Everyone uses AI separately: no shared context, no control over company data",
    whyNow: "Microsoft and Google now bundle AI into suites SMBs already pay for",
    rationale: ["Awareness isn’t the gap — a majority of small businesses already report using generative AI.", "The win is converting individual use into team adoption, not finding new users.", "Cross-tool usefulness is the edge suite-bundled AI can’t easily show."],
    evidence: [v("58% of U.S. small businesses report using generative AI in 2025.", "S5"), v("AI use among 10–100 employee firms was reported at 68% in 2025 (vendor survey).", "S9"), v("Microsoft 365 Copilot Business launched at $21/user for firms under 300 users.", "S3")],
  },
  positioning: {
    valueProposition: "One AI workspace your whole team already knows how to use.",
    differentiator: "Works across the tools small teams actually run — Google, Microsoft, Slack, GitHub, CRM — instead of living inside one suite.",
    pillars: [
      { name: "One workspace", line: "Swap scattered personal accounts for one shared, admin-managed space." },
      { name: "Your context", line: "Answers from your docs, chats and CRM, with citations." },
      { name: "Your data", line: "Business data isn’t used for training by default." },
    ],
    proof: [v("Connects to Google Workspace, Slack, GitHub and Microsoft 365, with SSO.", "S1"), v("Company knowledge gives cited answers across Slack, Drive and GitHub.", "S6"), v("No training on business data by default.", "S1", "S2")],
  },
  bigIdea: {
    campaignName: "Small Team. Big Output.",
    hook: "Twelve people. One shared brain.",
    concept: "Real small teams show one real workflow — proposals, pipeline reviews, onboarding — done in an afternoon with one shared ChatGPT, citations on screen.",
    visualDirection: "Documentary, warm and practical: real offices, real screens, the team in frame, the cited answer as the hero shot.",
    example: { format: "LinkedIn carousel", headline: "How a 12-person agency writes proposals in an hour", body: "Brief in Drive. Client thread in Slack. Deal history in the CRM. One question to their shared ChatGPT — and a cited first draft before lunch.", cta: "Set up your team" },
    whyItWorks: "It proves usefulness with a real job instead of claiming capability — and makes the team, not the tool, the hero.",
    steps: ["Recruit six small teams willing to be filmed", "Shoot one workflow per team, citations on screen", "Cut each into a long video, a carousel and two Shorts"],
    inspirationRef: "S13",
    inspirationNote: "Borrow real owners as the heroes; swap one-business vignettes for one-team workflows.",
  },
  channels: [
    {
      platform: "LinkedIn",
      role: "Reach the owners and ops leads who choose team tools",
      tactic: "Customer-voice carousels from small-business operators, boosted to founders and ops titles at 10–200 person companies",
      format: "Carousels + short clips",
      audience: "Founders, COOs, ops leads",
      cadence: "2 posts / week",
      kpi: "Cost per team trial",
      mock: { kind: "social_post", headline: "We retired 9 personal AI accounts last month.", body: "Our ops lead set up one shared ChatGPT workspace on a Tuesday. By Friday the whole team was drafting proposals from the same briefs. Here’s the 3-step setup we used 👇", },
      exampleRef: "S14",
      exampleNote: "Character-led small-business stories make AI feel practical, not technical.",
      steps: ["Interview 6 operators", "Turn each into a carousel", "Boost the top 2 to ops titles"],
    },
    {
      platform: "YouTube",
      role: "Capture people searching ‘ChatGPT for small business’",
      tactic: "A documentary-style series of real team workflows, one job per episode, with search-friendly titles",
      format: "8–12 min episodes + Shorts",
      audience: "Owner-operators evaluating tools",
      cadence: "1 episode every 2 weeks",
      kpi: "Views from search → sign-ups",
      mock: { kind: "long_video", headline: "Small Team, Big Output — Ep. 1: The 1-hour proposal", body: "A 12-person agency shows exactly how they write client proposals from Drive, Slack and their CRM in one cited chat." },
      exampleRef: "S15",
      exampleNote: "A competitor proves the long-form brand film; pair that ambition with practical demos.",
      steps: ["Script 6 workflows", "Film on location", "Publish with chaptered, search-led titles"],
    },
    {
      platform: "HubSpot community",
      role: "Meet sales teams where their CRM lives",
      tactic: "A co-hosted ‘AI-ready pipeline review’ session and template pack built on the existing ChatGPT connector",
      format: "Live session + templates",
      audience: "SMB sales and marketing leads",
      cadence: "Quarterly flagship",
      kpi: "Partner-sourced workspaces",
      mock: { kind: "event", headline: "Live: run Monday pipeline review with ChatGPT", body: "Bring your HubSpot pipeline. Leave with templates for account research, QBR prep and weekly reviews." },
      exampleRef: null,
      exampleNote: "",
      steps: ["Propose a joint session", "Build 5 templates", "Promote via partner newsletter"],
    },
  ],
  collaborators: [
    { name: "HubSpot", type: "partner", why: "Its SMB customers live in the CRM — a natural home for team AI workflows.", activation: "Joint pipeline-review series and template pack for SMB sales teams.", sourceRefs: [] },
    { name: "Jeff Su", type: "creator", why: "Teaches practical AI-at-work how-tos to a professional audience.", activation: "Sponsored episode: setting up AI for a whole team in an afternoon.", sourceRefs: ["S11"] },
    { name: "Melinda Emerson (Succeed As Your Own Boss)", type: "creator", why: "Small-business advisor whose podcast picks and guides reach owners looking for growth tools.", activation: "Co-create a “set up AI for your team in an afternoon” episode and checklist.", sourceRefs: ["S16"] },
  ],
  story: {
    angle: "Small businesses didn’t wait for permission to use AI — now they’re making it official.",
    whyInteresting: "It reframes AI adoption from hype to a practical governance story every small-business owner faces right now.",
    sampleHeadline: "Shadow AI goes legit: how small firms are turning personal ChatGPT habits into team tools",
    opportunities: [
      { outlet: "Constellation Insights", why: "Has covered how AI bundling changes the economics for business buyers.", sourceRef: "S4" },
      { outlet: "Adweek", why: "Covers how AI brands market to small businesses.", sourceRef: "S17" },
      { outlet: "Small-business press", why: "Customer stories with practical governance lessons travel well.", sourceRef: null },
    ],
    risks: ["Avoid any framing that implies watching employees’ personal accounts.", "Don’t claim productivity numbers without customer data."],
    evidence: [v("Most AI-using small businesses reported growing their workforce.", "S5")],
  },
  gamePlan: {
    actions: [
      { action: "Launch a consent-first ‘bring your team’ invite flow", why: "Turns existing users into internal champions." },
      { action: "Film the first three ‘Small Team. Big Output.’ episodes", why: "Proof beats claims against bundled AI." },
      { action: "Pitch HubSpot a joint pipeline-review session", why: "High-intent audience, integration already exists." },
    ],
    timeline: [
      { when: "Weeks 1–4", focus: "Invite flow test + recruit teams" },
      { when: "Weeks 5–8", focus: "Series launch + LinkedIn" },
      { when: "Weeks 9–12", focus: "Partner session + scale winners" },
    ],
    kpis: [
      { name: "Activated team workspaces", target: "3+ weekly active members by day 30" },
      { name: "Individual → team conversion", target: "+15% vs. baseline (hypothesis)" },
      { name: "Partner-sourced workspaces", target: "1 in 10 new teams (hypothesis)" },
    ],
  },
  assumptions: ["Concept demo: strategic recommendations are independent hypotheses, not OpenAI plans.", "Seat pricing and connector availability should be re-checked."],
};

export const EXAMPLES: { id: string; inputs: { product: string; about: string; audience: string; goal: string }; report: PlaybookReport }[] = [
  {
    id: "chatgpt-business",
    inputs: { product: "ChatGPT Business", about: "Concept demo built from public sources.", audience: "Small and midsize business teams", goal: "Increase adoption among SMB teams" },
    report: chatgptBusiness,
  },
];

let seeding: Promise<void> | null = null;

/** Idempotently stores example playbooks; fetches their link previews once in the background. */
export function ensureExamples(): Promise<void> {
  seeding ??= (async () => {
    const db = await getDb();
    for (const ex of EXAMPLES) {
      const [row] = await db.select({ inputHash: schema.playbooks.inputHash }).from(schema.playbooks).where(eq(schema.playbooks.id, ex.id));
      if (row?.inputHash === EXAMPLE_VERSION) continue;
      const sources: PlaybookSource[] = DEMO_SOURCES.map((s) => ({ ref: s.ref, title: s.title, url: s.url, publisher: s.publisher, publishedAt: s.publishedAt, excerpt: s.excerpt, origin: "example", topic: EXAMPLE_TOPICS[s.ref] ?? "market" }));
      await db.delete(schema.playbooks).where(eq(schema.playbooks.id, ex.id));
      await db.insert(schema.playbooks).values({ id: ex.id, inputHash: EXAMPLE_VERSION, inputs: ex.inputs, status: "done", report: ex.report, sources, generationMode: "example", isExample: true, finishedAt: new Date() });
      const urls = [ex.report.bigIdea.inspirationRef, ...ex.report.channels.map((c) => c.exampleRef), ...ex.report.collaborators.map((c) => c.sourceRefs[0]), ...ex.report.story.opportunities.map((o) => o.sourceRef)]
        .map((r) => sources.find((s) => s.ref === r)?.url)
        .filter((u): u is string => Boolean(u));
      void fetchThumbnails(urls)
        .then((thumbnails) => db.update(schema.playbooks).set({ thumbnails }).where(eq(schema.playbooks.id, ex.id)))
        .catch(() => {});
    }
  })().finally(() => {
    seeding = null;
  });
  return seeding;
}

