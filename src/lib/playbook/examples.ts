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

export const EXAMPLE_VERSION = "example-v5";

/** Which research bucket each example source belongs to (same rules as generated playbooks). */
const EXAMPLE_TOPICS: Record<string, string> = { S13: "examples", S14: "examples", S15: "examples", S4: "people", S11: "people", S16: "people", S17: "people", S21: "people", S22: "people" };

const v = (text: string, ...sourceRefs: string[]) => ({ text, status: "verified" as const, sourceRefs });

const chatgptBusiness: PlaybookReport = {
  productName: "ChatGPT Business",
  oneLiner: "A shared ChatGPT workspace, with agents, for small teams.",
  opportunity: {
    headline: "Win the small firms that compete for big clients, by making the size of their team stop mattering.",
    audience: "Owners of 5–50 person agencies, studios and consultancies",
    problem: "They lose work on capacity, not talent: proposals, follow-up and polish take people they don’t have.",
    whyNow: "Microsoft and Google bundle AI into tools owners already pay for. “Included” is winning by default.",
    rationale: [
      "Most small businesses already use AI, so awareness isn’t the gap. Seeing what a whole team can do with it is.",
      "Rivals sell AI as a suite feature. Nobody owns the result an owner cares about: being taken as seriously as a bigger firm.",
      "It fits how OpenAI already speaks to small businesses (lean teams, bigger capability) and the kind of ad that has worked best for it: real people over screens of text.",
    ],
    evidence: [
      v("58% of U.S. small businesses report using generative AI in 2025.", "S5"),
      v("OpenAI pitches ChatGPT Business as turning a lean team into a big force.", "S18"),
      v("Of twelve ChatGPT ads tested, only the grounded, human “Family Farm” beat the category benchmark.", "S20"),
    ],
  },
  positioning: {
    valueProposition: "Be the size your ambition needs.",
    differentiator: "The AI your team already knows, shared across the whole company, with agents that finish the work in the tools you use instead of inside one suite.",
    pillars: [
      { name: "More hands", line: "Agents take on proposals, follow-ups and admin, start to finish." },
      { name: "One shared brain", line: "Everyone works from the same files, clients and know-how." },
      { name: "Grown-up controls", line: "One admin, one bill, and no training on your data by default." },
    ],
    proof: [
      v("Includes agents: ChatGPT Work, Codex and dots.", "S18"),
      v("Plugins cover tools such as QuickBooks, HubSpot, Shopify and Canva.", "S18"),
      v("No training on business data by default.", "S1", "S18"),
    ],
  },
  bigIdea: {
    campaignName: "Guess the Headcount",
    hook: "Show the work. Hide the team. Let everyone guess wrong.",
    concept: "Show real work from a real small business and ask one question: how many people made this? Everyone guesses high. Then the tiny team walks into frame. The wrong guess is the product demo.",
    visualDirection: "The finished work fills the frame, almost no text. Then a plain portrait of the whole team, all of them, in their actual office.",
    example: { format: "Billboard + film", headline: "This agency has 12 people. Its proposals look like 120.", body: "The pitch that beat yours came from a room above a bike shop. Twelve people, one shared ChatGPT.", cta: "Be the 12" },
    whyItWorks: "People can’t resist guessing, and every wrong guess proves the point without a single claim about AI. The small team is the hero; being small becomes the brag.",
    steps: ["Cast 12 real teams whose work looks far bigger than they are", "Shoot each twice: the work alone, then the whole team", "Run the question first, the reveal second, everywhere"],
    inspirationRef: "S13",
    inspirationNote: "Google showed the owners using its AI. Hold the owners back and make the viewer guess first.",
  },
  launch: {
    moment: "Guess the Headcount, live: buyers judge unlabelled work on a livestream, then meet the tiny teams that made it.",
    when: "Launch day, week 6",
    hype: [
      { when: "4 weeks out", move: "Billboards show stunning work and one question: “How many people made this?” No logo." },
      { when: "2 weeks out", move: "Creators get early access and post their own guess. Owners join a waitlist to be a featured team." },
      { when: "Launch day", move: "The livestream reveals every team, and workspaces open to the waitlist in waves." },
    ],
    post: "For four weeks we’ve asked: how many people made this?\n\nThe top guess was 100.\nThe answer is 12.\n\nMeet the team, and what they share: ChatGPT Business. Live now.",
  },
  channels: [
    {
      platform: "X",
      role: "Start the guessing game and own launch day",
      tactic: "Post the work in the morning, let people guess in the replies, and reveal the team at noon.",
      format: "Image post, then reveal clip",
      audience: "Founders, marketers and the AI crowd",
      cadence: "One team a day for 12 days",
      kpi: "Guesses per post → team trials",
      mock: { kind: "social_post", headline: "How many people made this pitch?", body: "64 pages. A brand film. Three working prototypes. Delivered in four days.\nDrop your guess. We’ll introduce the whole team at noon." },
      exampleRef: null,
      exampleNote: "",
      steps: ["Post the work with no company name", "Pin the funniest and furthest-off guesses", "Quote-post the reveal clip at noon with the real number"],
    },
    {
      platform: "Streaming TV and billboards",
      role: "Make a small team look famous",
      tactic: "Run each film where its team lives, so local owners see a business they know, then take the best three national.",
      format: "30-second films + billboards",
      audience: "Owners and the clients they pitch",
      cadence: "Launch week, then 6 weeks",
      kpi: "Unaided recall of ChatGPT Business",
      mock: { kind: "long_video", headline: "You thought this was a big company.", body: "A slick product launch plays out. The camera pulls back: five people, a garage, one laptop on a paint can. “The whole company.” Logo early, barely any text." },
      exampleRef: "S14",
      exampleNote: "Copilot put a shop owner on screen. Go further: make the reveal of the owner the twist.",
      steps: ["Cut 12 local films and 12 billboards", "Show the brand by second five to protect recall", "Test with viewers, then fund the top three nationally"],
    },
    {
      platform: "Hands-on workshops",
      role: "Turn the idea into a first win",
      tactic: "Three-hour sessions in 12 cities, each hosted by that city’s featured team, where owners finish one real job.",
      format: "In person, 40 owners each",
      audience: "Owners of 5–50 person firms",
      cadence: "12 cities in 6 weeks",
      kpi: "Workspaces active 30 days later",
      mock: { kind: "event", headline: "Bring the job you can’t staff.", body: "Leave with it done. Three hours, your real work, and the 12-person agency from the billboard showing you how." },
      exampleRef: null,
      exampleNote: "",
      steps: ["Ask each owner for one overdue job at sign-up", "Finish it in the room in a shared workspace", "Invite their team before they leave"],
    },
  ],
  collaborators: [
    { name: "HubSpot’s agency partners", type: "partner", why: "Small agencies that pitch against bigger ones every week, and already live in a tool ChatGPT connects to.", activation: "Agencies nominate themselves with their best work. The boldest headcount gaps become the first films.", sourceRefs: ["S22"] },
    { name: "Jeff Su", type: "creator", why: "Teaches practical AI-at-work skills to professionals.", activation: "A blind-test episode: two pitches, one from a small firm and one from a giant. Can he tell which is which?", sourceRefs: ["S11"] },
    { name: "How I Built This", type: "media", why: "The show owners listen to for origin stories.", activation: "Sponsor “How Few Built This”: short stories of companies that stayed small on purpose.", sourceRefs: ["S21"] },
  ],
  story: {
    angle: "You used to be able to see a company’s size in its work. A blind test asks if you still can.",
    whyInteresting: "It gives reporters something to run, not just something to cover: real buyers, unlabelled pitches and a result. It also turns the AI-and-jobs debate toward small firms winning bigger work.",
    sampleHeadline: "We hid the company names. Could buyers tell the 12-person firm from the 1,200-person one?",
    opportunities: [
      { outlet: "Adweek", why: "Covers how AI brands court small businesses, and will want the blind test on agency pitches.", sourceRef: "S17" },
      { outlet: "Inc.", why: "Its readers are the owners in the films.", sourceRef: null },
      { outlet: "How I Built This", why: "Founders who chose to stay small make a strong episode.", sourceRef: "S21" },
    ],
    risks: [
      "It can read as “you don’t need staff.” Cast teams that are hiring, and keep the story about winning bigger work.",
      "Publish the blind test whatever it finds. If buyers can tell, that’s the story.",
      "Every piece of work shown must be real, with the team explaining what they did and what ChatGPT did.",
    ],
    evidence: [v("82% of small businesses using AI grew their workforce over the past year.", "S5")],
  },
  gamePlan: {
    actions: [
      { action: "Cast 12 teams with the widest gap between size and work", why: "The gap is the whole idea." },
      { action: "Run the blind test with real buyers before anything airs", why: "It proves the idea, or fixes it, early." },
      { action: "Build a “guess the headcount” page any team can use", why: "Lets every small business run its own version." },
    ],
    timeline: [
      { when: "Weeks 1–2", focus: "Cast teams, run the blind test, shoot" },
      { when: "Weeks 3–6", focus: "Unbranded billboards, guessing game, live reveal" },
      { when: "Weeks 7–12", focus: "City workshops, national films, team-made versions" },
    ],
    kpis: [
      { name: "Average guess vs. real headcount", target: "5x too high (hypothesis)" },
      { name: "New workspaces with 3+ active people at day 30", target: "+15% vs. baseline (hypothesis)" },
      { name: "Teams that post their own headcount reveal", target: "1,000 in 90 days (hypothesis)" },
    ],
  },
  assumptions: [
    "Concept demo: these recommendations are independent ideas, not OpenAI plans.",
    "Written as if ChatGPT Business were launching now.",
    "Teams, posts, guesses and ads shown are illustrative. Real ones would need casting and consent.",
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

