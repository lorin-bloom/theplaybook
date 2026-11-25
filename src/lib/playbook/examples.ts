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

export const EXAMPLE_VERSION = "example-v7";

/** Which research bucket each example source belongs to (same rules as generated playbooks). */
const EXAMPLE_TOPICS: Record<string, string> = { S13: "examples", S14: "examples", S15: "examples", S4: "people", S11: "people", S16: "people", S17: "people", S21: "people", S22: "people" };

const v = (text: string, ...sourceRefs: string[]) => ({ text, status: "verified" as const, sourceRefs });

const chatgptBusiness: PlaybookReport = {
  productName: "ChatGPT Business",
  oneLiner: "A shared ChatGPT workspace, with agents, for small teams.",
  opportunity: {
    headline: "Help small firms win the bigger work that lets them grow, and hire.",
    audience: "Owners of 5–50 person agencies, studios and shops",
    problem: "They have the talent. Proposals, follow-ups and admin eat the hours they need to go after bigger clients.",
    whyNow: "Microsoft and Google bundle AI into suites on price. Growth is a promise bundling can’t match.",
    rationale: [
      "Most small businesses already use AI, so awareness isn’t the gap. A reason the whole team would welcome it is.",
      "Owners don’t want more software. They want the next client, and the next person on the team.",
      "It fits how OpenAI already speaks to small businesses (ambition, bigger capability) and the kind of ad that has worked best for it: real people over screens of text.",
    ],
    evidence: [
      v("82% of small businesses using AI grew their workforce over the past year.", "S5"),
      v("OpenAI pitches ChatGPT Business as turning a lean team into a big force.", "S18"),
      v("Of twelve ChatGPT ads tested, only the grounded, human “Family Farm” beat the category benchmark.", "S20"),
    ],
  },
  positioning: {
    valueProposition: "Take on the work you used to turn down.",
    differentiator: "The AI your team already knows, shared across the whole company, so people spend their hours on the work clients hire them for.",
    pillars: [
      { name: "More time for the craft", line: "Hand off follow-ups and admin. Keep the work only your people can do." },
      { name: "One shared brain", line: "Everyone works from the same files, clients and know-how." },
      { name: "Safe for the team", line: "One admin, one bill, and no training on your data by default." },
    ],
    proof: [
      v("Includes agents: ChatGPT Work, Codex and dots.", "S18"),
      v("Plugins cover tools such as QuickBooks, HubSpot, Shopify and Canva.", "S18"),
      v("No training on business data by default.", "S1", "S18"),
    ],
  },
  bigIdea: {
    campaignName: "Now Hiring",
    hook: "An AI company’s biggest ad campaign: real job openings.",
    concept: "Small businesses use ChatGPT Business to go after bigger work and win it. OpenAI then gives them its ad space, to advertise the people they need next. Every ad is a real opening.",
    visualDirection: "Hand-painted help-wanted signs at billboard scale. Real teams in real shops, saving a place for someone new. Almost no text.",
    example: { format: "Billboard + film", headline: "This agency has 12 people. It’s looking for number 13.", body: "They pitched a client they used to think was too big for them, and won. Now there’s a desk by the window with no one at it.", cta: "Apply to be No. 13" },
    whyItWorks: "An AI ad that ends with a job is a surprise. It’s generous, easy to share, and shows the product through what people did with it.",
    steps: ["Find 12 small businesses that won bigger work and are hiring", "Turn each opening into a billboard and a film", "Follow the hires, and tell the story of their first day"],
    inspirationRef: "S13",
    inspirationNote: "Google gave small businesses the screen. Give them something they need: applicants.",
  },
  launch: {
    moment: "Now Hiring, live: 12 small businesses tell the story of their biggest win, then open real jobs on the livestream.",
    when: "Launch day, week 6",
    hype: [
      { when: "4 weeks out", move: "Hand-painted signs appear in 12 cities: “We just won something big.” No logo." },
      { when: "2 weeks out", move: "Creators get early access and help one local business go after its biggest bid yet." },
      { when: "Launch day", move: "The signs are repainted as job openings, live on the stream, and ChatGPT Business opens to teams." },
    ],
    post: "We bought billboards in 12 cities and gave them to small businesses that are hiring.\n\nThey used ChatGPT Business to go after bigger work. They won it. Now they need more people.\n\nMeet them. Apply. Live now.",
  },
  channels: [
    {
      platform: "X",
      role: "Own launch day and get the jobs shared",
      tactic: "Post one business a day: the win, the team behind it, and the person they’re looking for.",
      format: "Short film + job post",
      audience: "Founders, job seekers and the AI crowd",
      cadence: "One business a day for 12 days",
      kpi: "Shares per opening → team trials",
      mock: { kind: "social_post", headline: "This four-person bakery needs a fifth.", body: "They just landed 40 cafés, their biggest order ever. The plan came together in one shared ChatGPT. The bread still needs hands.\nBaker wanted. Apply below." },
      exampleRef: null,
      exampleNote: "",
      steps: ["Lead with the team and the win, not the tool", "Link straight to the real opening", "Post again when the job is filled"],
    },
    {
      platform: "Streaming TV and billboards",
      role: "Make small teams feel famous",
      tactic: "Run each film and billboard where the business is, so neighbors see a place they know and a job they could have.",
      format: "30-second films + billboards",
      audience: "Owners, and the people they’d hire",
      cadence: "Launch week, then 6 weeks",
      kpi: "Unaided recall of ChatGPT Business",
      mock: { kind: "long_video", headline: "A desk for someone they haven’t met yet.", body: "A 12-person studio gets the call: they won. Then they clear a desk, order a chair and cut a new key. “Now hiring.” Logo early, barely any text." },
      exampleRef: "S14",
      exampleNote: "Copilot put a shop owner’s problem on screen. Show what comes after it’s solved.",
      steps: ["Cut 12 local films and 12 billboards", "Show the brand by second five to protect recall", "Test with viewers, then fund the top three nationally"],
    },
    {
      platform: "Hands-on workshops",
      role: "Give owners their first bigger win",
      tactic: "Three-hour sessions in 12 cities, hosted by that city’s featured business, where owners and their teams build one ambitious bid.",
      format: "In person, 20 teams each",
      audience: "Owners and their teams",
      cadence: "12 cities in 6 weeks",
      kpi: "Workspaces active 30 days later",
      mock: { kind: "event", headline: "Bring the bid you think is too big.", body: "Leave ready to send it. Three hours, your real team, and the agency from the billboard showing you how they won theirs." },
      exampleRef: null,
      exampleNote: "",
      steps: ["Ask each owner to bring one teammate and one bid", "Build it together in a shared workspace", "Check back in 30 days and celebrate the wins"],
    },
  ],
  collaborators: [
    { name: "HubSpot’s agency partners", type: "partner", why: "Small agencies that pitch for bigger clients every week, and already live in a tool ChatGPT connects to.", activation: "Agencies that just won a bigger client and are hiring nominate themselves. The best stories become the first films.", sourceRefs: ["S22"] },
    { name: "Jeff Su", type: "creator", why: "Teaches practical AI-at-work skills to professionals.", activation: "An episode where he coaches a small team through the biggest bid of its life.", sourceRefs: ["S11"] },
    { name: "How I Built This", type: "media", why: "The show owners listen to for origin stories.", activation: "Sponsor “The First Ten Hires”: founders on the people who changed their company.", sourceRefs: ["S21"] },
  ],
  story: {
    angle: "An AI company hands its ad space to small businesses, so they can find their next great hire.",
    whyInteresting: "It turns an AI launch into something people can check: real businesses, real openings and real first days. Reporters get local stories in 12 cities.",
    sampleHeadline: "OpenAI’s biggest new ad campaign is a help-wanted sign",
    opportunities: [
      { outlet: "Adweek", why: "Covers how AI brands court small businesses, and the flip is the story.", sourceRef: "S17" },
      { outlet: "Local business press", why: "Every city has a business, a win and an opening to write about.", sourceRef: null },
      { outlet: "How I Built This", why: "Founders on their first hires make a strong episode.", sourceRef: "S21" },
    ],
    risks: [
      "Only feature openings that are real, funded and paid fairly. One fake job ends the campaign.",
      "Don’t claim AI created the jobs. The team won the work; ChatGPT helped them go after it.",
      "Skip businesses that have recently cut staff.",
    ],
    evidence: [v("82% of small businesses using AI grew their workforce over the past year.", "S5")],
  },
  gamePlan: {
    actions: [
      { action: "Find 12 small businesses that won bigger work and are hiring", why: "The campaign only works if it’s true." },
      { action: "Verify every opening: real, funded, fairly paid", why: "Trust is the whole idea." },
      { action: "Give any hiring team a free “Now Hiring” poster kit", why: "Lets thousands of businesses join in." },
    ],
    timeline: [
      { when: "Weeks 1–2", focus: "Find the businesses, verify jobs, shoot" },
      { when: "Weeks 3–6", focus: "Unbranded signs, creator bids, live launch" },
      { when: "Weeks 7–12", focus: "City workshops, national films, first-day stories" },
    ],
    kpis: [
      { name: "Featured jobs filled", target: "All 12 within 60 days (hypothesis)" },
      { name: "New workspaces with 3+ active people at day 30", target: "+15% vs. baseline (hypothesis)" },
      { name: "Businesses that post their own “Now Hiring”", target: "1,000 in 90 days (hypothesis)" },
    ],
  },
  assumptions: [
    "Concept demo: these recommendations are independent ideas, not OpenAI plans.",
    "Written as if ChatGPT Business were launching now.",
    "Businesses, wins, jobs and ads shown are illustrative. Real ones would need casting, checking and consent.",
  ],
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

