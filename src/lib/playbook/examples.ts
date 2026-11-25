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

export const EXAMPLE_VERSION = "example-v8";

/** Which research bucket each example source belongs to (same rules as generated playbooks). */
const EXAMPLE_TOPICS: Record<string, string> = { S13: "examples", S14: "examples", S15: "examples", S4: "people", S11: "people", S16: "people", S17: "people", S21: "people", S22: "people" };

const v = (text: string, ...sourceRefs: string[]) => ({ text, status: "verified" as const, sourceRefs });

const chatgptBusiness: PlaybookReport = {
  productName: "ChatGPT Business",
  oneLiner: "One secure workspace for a small team, its apps, its knowledge and its agents.",
  opportunity: {
    headline: "Own the someday list: the ambitious work small teams keep putting off because today is already full.",
    audience: "Owners of 2–50 person shops, studios and service firms",
    problem: "The idea that would grow the business waits behind everything due today.",
    whyNow: "The holiday rush pushes every big idea to “after the holidays.” January is when owners look at the list again.",
    rationale: [
      "OpenAI’s own promise is ambition: bigger capability for lean teams, including work that would otherwise fall to the wayside.",
      "Its usage data points the same way. Small teams lean on agents for finance, supply chain, legal and marketing, where they rarely have a specialist.",
      "Rivals sell time saved on everyday tasks. The thing an owner never got to start is a bigger, more personal promise.",
    ],
    evidence: [
      v("OpenAI says ChatGPT Work can take on tasks that would otherwise be outsourced or fall to the wayside.", "S19"),
      v("Finance, supply chain, legal and marketing each take at least 3x the share of small firms’ agent use vs. larger firms’.", "S23"),
      v("Of twelve ChatGPT ads tested, only the grounded, human “Family Farm” beat the category benchmark.", "S20"),
    ],
  },
  positioning: {
    valueProposition: "The idea you’ve been saving for someday, ready to start Monday.",
    differentiator: "Suite AI helps inside each app. ChatGPT Business works across the apps, files and know-how a small team already has, and sees the project through.",
    pillars: [
      { name: "Everyone in one place", line: "Your team, your apps and what your business knows, in one workspace." },
      { name: "Always moving", line: "ChatGPT Work, Codex and your dots carry projects forward." },
      { name: "Yours, and secure", line: "One admin, clear controls, no training on your data by default." },
    ],
    proof: [
      v("Brings team, business knowledge and apps together in one secure workspace.", "S18"),
      v("Includes ChatGPT Work, Codex and dots.", "S18", "S25"),
      v("No training on business data by default.", "S18", "S25"),
    ],
  },
  bigIdea: {
    campaignName: "Someday Is Monday",
    hook: "Every small business has a someday list. We’re giving it a date.",
    concept: "Ask owners for the idea they’ve been putting off. Put their real handwritten notes on billboards. Then, on one Monday, they start, and the notes get crossed out in public as each idea becomes real.",
    visualDirection: "Real handwriting on fridge notes, receipts and napkins, blown up huge. One thick line through it when it’s done.",
    example: { format: "Billboard + film", headline: "“Someday we’ll sell the hot sauce online.”", body: "Someday is Monday. The recipe cards, the supplier emails and the whole family, in one workspace.", cta: "Bring your someday" },
    whyItWorks: "Everyone has a someday list, so everyone gets it at once. Crossing it out shows what the product does without explaining AI.",
    steps: ["Collect owners’ real someday notes over the holidays", "Put the best on billboards in their own handwriting", "Start them all on one Monday, and cross them out in public"],
    inspirationRef: "S13",
    inspirationNote: "Google showed owners’ everyday tasks getting done. Show the big one they never got to.",
  },
  launch: {
    moment: "Someday, live: ten small businesses start the idea they’ve been putting off, together, on one livestream.",
    when: "Monday, January 4",
    hype: [
      { when: "Small Business Saturday", move: "Handwritten billboards appear: “Someday we’ll open on Sundays.” No logo, no explanation." },
      { when: "Mid-December", move: "Owners post their own someday lists. Creators get early access and each adopt one." },
      { when: "January 4", move: "Every billboard changes to “Someday is Monday,” then gets crossed out as teams finish." },
    ],
    post: "Sell the hot sauce online.\nOpen on Sundays.\nFinally fix the price list.\n\nSomeday is Monday.\n\nBring your team, your apps and everything you know into one place. ChatGPT Business, live now.",
  },
  channels: [
    {
      platform: "X",
      role: "Start the lists and own launch day",
      tactic: "Share one real someday a day, invite owners to reply with theirs, then follow ten of them from start to finish.",
      format: "Photo of the note, then daily clips",
      audience: "Founders, owners and the AI crowd",
      cadence: "Daily from mid-December",
      kpi: "Someday lists shared → team trials",
      mock: { kind: "social_post", headline: "“Someday we’ll sell the hot sauce online.”", body: "On the Ruiz family’s fridge since 2019. This Monday all four of them start, in one ChatGPT workspace.\nWhat’s been on your fridge the longest?" },
      exampleRef: null,
      exampleNote: "",
      steps: ["Post the note in the owner’s handwriting", "Show the team deciding, and what ChatGPT handled", "Post the crossed-out note when it’s real"],
    },
    {
      platform: "Streaming TV and billboards",
      role: "Make someday feel urgent",
      tactic: "Run each billboard in the owner’s own neighborhood and one film nationally, so the idea feels both local and big.",
      format: "Billboards + 60-second film",
      audience: "Owners of 2–50 person businesses",
      cadence: "Late November to February",
      kpi: "Unaided recall of ChatGPT Business",
      mock: { kind: "long_video", headline: "Someday. Someday. Someday. Monday.", body: "Notes on fridges, receipts and napkins. An alarm goes off. A family turns on the kitchen lights and gets started. Logo early, barely any text." },
      exampleRef: "S14",
      exampleNote: "Copilot put a shop owner’s daily problem on screen. Show the dream behind it.",
      steps: ["Show the brand by second five to protect recall", "Use owners’ real handwriting and real places", "Test with viewers before buying national"],
    },
    {
      platform: "Hands-on workshops",
      role: "Turn the idea into a first win",
      tactic: "Three-hour Monday sessions in ten cities where owners bring a teammate and one idea, and leave with it started.",
      format: "In person, 20 teams each",
      audience: "Owners and their teams",
      cadence: "Mondays in January",
      kpi: "Workspaces active 30 days later",
      mock: { kind: "event", headline: "Bring your someday. Start it by lunch.", body: "Three hours, your real idea, a teammate, and people who’ll help you build it in one shared workspace." },
      exampleRef: null,
      exampleNote: "",
      steps: ["Ask for one idea at sign-up", "Connect the apps and files it needs, in the room", "Leave with the first piece done and the rest planned"],
    },
  ],
  collaborators: [
    { name: "Shopify", type: "partner", why: "“Open an online store” is on a lot of someday lists, and it connects to ChatGPT.", activation: "Help the featured shops go from note to open store, and invite its merchants to share theirs.", sourceRefs: ["S22"] },
    { name: "Jeff Su", type: "creator", why: "Teaches practical AI-at-work skills to professionals.", activation: "Adopts one small team’s someday and shows the whole week, including what took longer than planned.", sourceRefs: ["S11"] },
    { name: "How I Built This", type: "media", why: "The show owners listen to for origin stories.", activation: "Sponsor “The Monday It Started”: founders on the idea they sat on, and the day they began.", sourceRefs: ["S21"] },
  ],
  story: {
    angle: "Every small business has one idea it never has time for. OpenAI asked to see the list.",
    whyInteresting: "The lists are the story: funny, honest and local. They show what owners across the country dream about, and what happens when they begin.",
    sampleHeadline: "What’s on America’s someday list? 1,000 small-business owners share the idea they never had time to start",
    opportunities: [
      { outlet: "Inc.", why: "Its readers wrote the lists.", sourceRef: null },
      { outlet: "Adweek", why: "Covers how AI brands court small businesses, and billboards that change in public are a story.", sourceRef: "S17" },
      { outlet: "How I Built This", why: "The moment an idea finally starts is its whole subject.", sourceRef: "S21" },
    ],
    risks: [
      "Don’t promise a finished business in a week. Show what got started and what’s still unfinished.",
      "Owners must approve their note, handwriting and story.",
      "Be clear about what the team decided and made, and what ChatGPT handled.",
    ],
    evidence: [v("58% of U.S. small businesses report using generative AI in 2025.", "S5")],
  },
  gamePlan: {
    actions: [
      { action: "Collect 1,000 someday lists before December 15", why: "The lists feed the billboards, the report and the cast." },
      { action: "Choose ten teams and film the week they start", why: "Real work is the proof." },
      { action: "Use the plan’s ad credits to find each idea its first customers", why: "Connects starting the idea to selling it." },
    ],
    timeline: [
      { when: "Late November", focus: "Unbranded notes go up, lists open" },
      { when: "December", focus: "Creators adopt ideas, ten teams chosen" },
      { when: "January", focus: "Live launch, Monday workshops, notes crossed out" },
    ],
    kpis: [
      { name: "Someday lists shared", target: "10,000 by January 4 (hypothesis)" },
      { name: "New workspaces with 3+ active people at day 30", target: "+15% vs. baseline (hypothesis)" },
      { name: "Ideas crossed out in public", target: "500 by the end of March (hypothesis)" },
    ],
  },
  assumptions: [
    "Concept demo: these recommendations are independent ideas, not OpenAI plans.",
    "Written as if ChatGPT Business were launching this January.",
    "Owners, notes, posts and ads shown are illustrative. Real ones would need casting and consent. Ad credits depend on country and workspace.",
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

