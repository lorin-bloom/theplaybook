import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { setAnthropicClientForTests } from "@/lib/ai/client";
import { PlaybookReport, type PlaybookInputs } from "@/lib/playbook/schema";
import { createPlaybook, buildUserMessage, enforceLinkPurpose, friendlyError, getPlaybook } from "@/lib/playbook/generate";
import { LimitError, checkLimits } from "@/lib/playbook/limits";
import { enforceProvenance } from "@/lib/playbook/provenance";
import { mockPlaybook } from "@/lib/playbook/mock";
import { EXAMPLES, ensureExamples } from "@/lib/playbook/examples";
import { isAboutProduct, isListicle, planQueries } from "@/lib/research/research";
import { ogImageFromHtml, youtubeThumbnail } from "@/lib/playbook/thumbnails";
import { playbookToMarkdown } from "@/lib/playbook/markdown";
import { BudgetExceededError } from "@/lib/cost/budget";
import { newId } from "@/lib/util/hash";
import { fakeClient, freshDb, searchMessage, textMessage, waitForPlaybook } from "./helpers/setup";

const inputs = (over: Partial<PlaybookInputs> = {}): PlaybookInputs => ({
  product: "Acme Insights",
  about: "SECRET-PRIVATE-DETAIL: we plan to undercut Looker by 40%.",
  audience: "FP&A leaders",
  goal: "500 paying teams",
  ...over,
});

let n = 0;
const visitor = () => `v${++n}`;
/** Research calls carry the web_search tool; the writing call has no tools. */
const isSearch = (c: Record<string, unknown>) => JSON.stringify(c.tools ?? []).includes("web_search");
/** Which research batch a search call is for. */
const batch = (c: Record<string, unknown>) => (JSON.stringify(c.messages).match(/marketing plan \((\w+)\)/)?.[1] ?? "?");

beforeEach(async () => {
  await freshDb();
});
afterEach(() => {
  setAnthropicClientForTests(null);
  vi.unstubAllEnvs();
});

describe("report contract", () => {
  it("example and mock playbooks satisfy the schema", () => {
    for (const e of EXAMPLES) expect(PlaybookReport.safeParse(e.report).success, e.id).toBe(true);
    expect(PlaybookReport.safeParse(mockPlaybook(inputs())).success).toBe(true);
  });

  it("every verified example claim cites a real example source", async () => {
    await ensureExamples();
    const p = (await getPlaybook("chatgpt-business"))!;
    const refs = new Set(p.sources.map((s) => s.ref));
    const walk = (x: unknown): void => {
      if (Array.isArray(x)) return x.forEach(walk);
      if (!x || typeof x !== "object") return;
      const o = x as Record<string, unknown>;
      if (o.status === "verified") for (const r of o.sourceRefs as string[]) expect(refs.has(r), r).toBe(true);
      Object.values(o).forEach(walk);
    };
    walk(p.report);
    expect(p.isExample).toBe(true);
    expect(p.generationMode).toBe("example");
  });

  it("exports all seven sections to Markdown", () => {
    const md = playbookToMarkdown(EXAMPLES[0].report, [], true);
    for (const h of ["The Opportunity", "The Positioning", "The Big Idea", "Where to Show Up", "Dream Collaborators", "The Story Worth Telling", "The Game Plan"]) expect(md).toContain(h);
    expect(md).toContain("Concept demo");
  });
});

describe("provenance", () => {
  it("strips invented links and never shows uncited claims as verified", () => {
    const { content } = enforceProvenance(
      { exampleRef: "S99", inspirationRef: "S1", sourceRefs: ["S1", "S1", "S42"], evidence: [{ text: "x", status: "verified", sourceRefs: ["S77"] }] },
      ["S1"],
    );
    expect(content.exampleRef).toBeNull();
    expect(content.inspirationRef).toBe("S1");
    expect(content.sourceRefs).toEqual(["S1"]);
    expect(content.evidence[0]).toEqual({ text: "x", status: "hypothesis", sourceRefs: [] });
  });
});

describe("pre-launch link rules", () => {
  it("recognises pages about the product itself", () => {
    expect(isAboutProduct({ title: "How Sam Altman uses Dots", url: "https://every.to/podcast/x" }, "ChatGPT Dots")).toBe(true);
    expect(isAboutProduct({ title: "Guide", url: "https://site.com/blog/chatgpt-dots-alternatives" }, "ChatGPT Dots")).toBe(true);
    expect(isAboutProduct({ title: "Anthropic launches Keep thinking", url: "https://axios.com/claude" }, "ChatGPT Dots")).toBe(false);
    expect(isAboutProduct({ title: "Lenny's Podcast", url: "https://lennys.example" }, "Linear")).toBe(false);
    // Brand family counts too: OpenAI's own ChatGPT campaign is not a competitor example for ChatGPT Dots.
    expect(isAboutProduct({ title: "OpenAI's first major ChatGPT brand campaign", url: "https://thedrum.com/news/x" }, "ChatGPT Dots")).toBe(true);
    expect(isAboutProduct({ title: "OpenAI takes on Meta's Muse with new Dot agents", url: "https://fortune.com/x" }, "ChatGPT Dots")).toBe(true);
    expect(isListicle("9 Best AI Podcasts in 2026 (Verified Still Publishing)")).toBe(true);
    expect(isListicle("Latent Space: The AI Engineer Podcast")).toBe(false);
    // Generic words don't count: a Google Workspace "business" campaign isn't about "ChatGPT Business".
    expect(isAboutProduct({ title: "Google Workspace small business ads", url: "https://blog.google/x" }, "ChatGPT Business")).toBe(false);
  });

  it("only lets each link come from its own research bucket", () => {
    const sources = [
      { ref: "S1", topic: "market" },
      { ref: "S2", topic: "examples" },
      { ref: "S3", topic: "people" },
    ] as never;
    const r = mockPlaybook(inputs());
    r.bigIdea.inspirationRef = "S1";
    r.channels[0].exampleRef = "S2";
    r.channels[1].exampleRef = "S3";
    r.collaborators[0].sourceRefs = ["S1", "S3"];
    r.story.opportunities[0].sourceRef = "S2";
    r.story.evidence = [{ text: "Launch got press", status: "verified", sourceRefs: ["S4"] }];
    const out = enforceLinkPurpose(r, [...(sources as unknown as object[]), { ref: "S4", topic: "market", aboutProduct: true }] as never);
    expect(out.bigIdea.inspirationRef).toBeNull();
    expect(out.channels.map((c) => c.exampleRef).slice(0, 2)).toEqual(["S2", null]);
    expect(out.collaborators[0].sourceRefs).toEqual(["S3"]);
    expect(out.story.opportunities[0].sourceRef).toBeNull();
    expect(out.story.evidence[0]).toMatchObject({ status: "hypothesis", sourceRefs: [] }); // no existing coverage in the PR plan
  });

  it("the example playbook follows the same rules", async () => {
    await ensureExamples();
    const p = (await getPlaybook("chatgpt-business"))!;
    expect(enforceLinkPurpose(p.report!, p.sources)).toEqual(p.report);
  });
});

describe("research privacy & efficiency", () => {
  it("search queries use only the product and audience — never the private description or goal", () => {
    const q = JSON.stringify(planQueries(inputs()));
    expect(q).toContain("Acme Insights");
    expect(q).toContain("FP&A leaders");
    expect(q).not.toContain("SECRET");
    expect(q).not.toContain("500 paying");
  });

  it("truncates long documents and says so", () => {
    const msg = buildUserMessage(inputs(), [{ name: "brief.pdf", text: "a".repeat(1000) }], [], 300);
    expect(msg).toContain("Document truncated: first 300 characters used");
    expect(msg).toContain('<untrusted_document id="U1">');
  });
});

describe("pipeline (dev mock mode — no paid calls)", () => {
  it("creates a complete playbook and reuses it for identical inputs", async () => {
    const v = visitor();
    const { id, reused } = await createPlaybook(inputs(), [], v);
    expect(reused).toBe(false);
    const p = await waitForPlaybook(id);
    expect(p.status).toBe("done");
    expect(PlaybookReport.safeParse(p.report).success).toBe(true);
    expect(p.generationMode).toBe("mock");

    const again = await createPlaybook(inputs({ product: "  acme insights " }), [], visitor());
    expect(again).toEqual({ id, reused: true });
    const other = await createPlaybook(inputs({ goal: "Different goal" }), [], v);
    expect(other.id).not.toBe(id);
  });
});

describe("wallet protection", () => {
  it("caps playbooks per visitor per day", async () => {
    vi.stubEnv("PLAYBOOKS_PER_VISITOR_PER_DAY", "2");
    const v = visitor();
    await createPlaybook(inputs({ product: "One" }), [], v);
    await createPlaybook(inputs({ product: "Two" }), [], v);
    await expect(createPlaybook(inputs({ product: "Three" }), [], v)).rejects.toBeInstanceOf(LimitError);
    // Another visitor is unaffected, and repeats are free and uncapped.
    await expect(createPlaybook(inputs({ product: "Three" }), [], visitor())).resolves.toBeTruthy();
    await expect(createPlaybook(inputs({ product: "One" }), [], v)).resolves.toMatchObject({ reused: true });
  });

  it("doesn't count failed playbooks against a visitor's daily allowance", async () => {
    vi.stubEnv("PLAYBOOKS_PER_VISITOR_PER_DAY", "1");
    const v = visitor();
    const db = await getDb();
    await db.insert(schema.playbooks).values({ id: "failedone1", inputHash: "x", inputs: inputs(), status: "error", visitor: v });
    await expect(createPlaybook(inputs({ product: "After a failure" }), [], v)).resolves.toBeTruthy();
  });

  it("caps total playbooks per day", async () => {
    vi.stubEnv("PLAYBOOKS_PER_DAY", "1");
    await createPlaybook(inputs({ product: "First" }), [], visitor());
    await expect(createPlaybook(inputs({ product: "Second" }), [], visitor())).rejects.toThrow(/daily limit/);
  });

  it("stops new playbooks when the monthly budget is used up", async () => {
    vi.stubEnv("MONTHLY_BUDGET_USD", "1");
    const db = await getDb();
    await db.insert(schema.usageEvents).values({ id: newId("u_"), operation: "x", model: "m", costUsd: 0.95 });
    await expect(checkLimits(visitor())).rejects.toThrow(/usage limit for this month/);
  });
});

describe("live path with a fake Anthropic client", () => {
  function liveEnv() {
    vi.stubEnv("AI_MODE", "live");
    vi.stubEnv("ANTHROPIC_API_KEY", "test");
    vi.stubEnv("RESEARCH_PROVIDER", "anthropic");
  }

  it("researches cheaply, writes the whole playbook in ONE call, and drops invented links", async () => {
    liveEnv();
    const report = mockPlaybook(inputs());
    report.channels[0].exampleRef = "S2"; // competitor campaign (examples batch)
    report.channels[1].exampleRef = "S999"; // invented
    report.channels[2].exampleRef = "S1"; // a market fact — not allowed as an example
    const fake = fakeClient((params) =>
      isSearch(params)
        ? batch(params) === "examples"
          ? searchMessage("https://rival.example/launch-film", "Rival's launch film follows real finance teams.")
          : batch(params) === "people"
            ? searchMessage("https://pod.example/finance-show", "A podcast for finance leaders.")
            : searchMessage("https://acme.example/case", "Acme cut close time by 3 days.")
        : textMessage(report),
    );
    setAnthropicClientForTests(fake.client);

    const { id } = await createPlaybook(inputs(), [], visitor());
    const p = await waitForPlaybook(id);
    expect(p.status).toBe("done");

    const research = fake.calls.filter(isSearch);
    const writing = fake.calls.filter((c) => !isSearch(c));
    expect(research.map((c) => c.model)).toEqual(["claude-haiku-5-5", "claude-haiku-5-5", "claude-haiku-5-5"]);
    expect(research.map(batch)).toEqual(["market", "examples", "people"]);
    expect(writing.map((c) => c.model)).toEqual(["claude-sonnet-5-5"]);
    // The 7-section schema exceeds the strict-grammar limit, so the shape is described in the prompt.
    expect((writing[0].output_config as Record<string, unknown>).format).toBeUndefined();
    expect(writing[0].tools).toBeUndefined();
    expect(JSON.stringify(research)).not.toContain("SECRET"); // private text never sent to search
    expect(JSON.stringify((research[0].tools as unknown[])[0])).toContain("web_search_20250305");

    expect(p.sources.map((s) => [s.ref, s.topic])).toEqual([["S1", "market"], ["S2", "examples"], ["S3", "people"]]);
    expect(p.report!.channels[0].exampleRef).toBe("S2");
    expect(p.report!.channels[1].exampleRef).toBeNull();
    expect(p.report!.channels[2].exampleRef).toBeNull(); // facts can't be shown as examples
    expect(p.costUsd).toBeGreaterThan(0);

    // Same request again: served from the saved playbook, zero new calls.
    const before = fake.calls.length;
    await createPlaybook(inputs(), [], visitor());
    expect(fake.calls.length).toBe(before);
  });

  it("reuses cached research across different playbooks for the same product", async () => {
    liveEnv();
    const fake = fakeClient((params) => (isSearch(params) ? searchMessage("https://acme.example/a", "Quote.") : textMessage(mockPlaybook(inputs()))));
    setAnthropicClientForTests(fake.client);
    await waitForPlaybook((await createPlaybook(inputs({ goal: "Goal A" }), [], visitor())).id);
    await waitForPlaybook((await createPlaybook(inputs({ goal: "Goal B" }), [], visitor())).id);
    expect(fake.calls.filter(isSearch)).toHaveLength(3); // only the first playbook searched (3 batches)
    expect(fake.calls.filter((c) => !isSearch(c))).toHaveLength(2);
  });

  it("never makes the paid writing call once the budget is exhausted", async () => {
    liveEnv();
    vi.stubEnv("MONTHLY_BUDGET_USD", "0.25");
    const fake = fakeClient((params) => (isSearch(params) ? searchMessage("https://acme.example/b", "Q.") : textMessage(mockPlaybook(inputs()))));
    setAnthropicClientForTests(fake.client);
    const { id } = await createPlaybook(inputs(), [], visitor());
    const db = await getDb();
    await db.insert(schema.usageEvents).values({ id: newId("u_"), operation: "x", model: "m", costUsd: 0.25 }); // spend hits the cap mid-run
    const p = await waitForPlaybook(id);
    expect(p.status).toBe("error");
    expect(p.error).toMatch(/usage limit/);
    expect(fake.calls.filter((c) => !isSearch(c))).toHaveLength(0);
  });

  it("tolerates fenced or chatty JSON replies and unknown enum values", async () => {
    liveEnv();
    const report = mockPlaybook(inputs()) as unknown as { channels: { mock: { kind: string } }[] };
    report.channels[0].mock.kind = "tiktok_duet"; // not a known kind
    const fake = fakeClient((params) => (isSearch(params) ? searchMessage("https://acme.example/c", "Q.") : { content: [{ type: "text", text: "Here you go:\n```json\n" + JSON.stringify(report) + "\n```" }] }));
    setAnthropicClientForTests(fake.client);
    const p = await waitForPlaybook((await createPlaybook(inputs({ goal: "Fenced" }), [], visitor())).id);
    expect(p.status).toBe("done");
    expect(p.report!.channels[0].mock.kind).toBe("social_post");
  });

  it("works from just a product name", async () => {
    liveEnv();
    const fake = fakeClient((params) => (isSearch(params) ? searchMessage("https://dots.example/a", "Q.") : textMessage(mockPlaybook(inputs()))));
    setAnthropicClientForTests(fake.client);
    const p = await waitForPlaybook((await createPlaybook({ product: "ChatGPT Dots", about: "", audience: "", goal: "" }, [], visitor())).id);
    expect(p.status).toBe("done");
    const writing = fake.calls.find((c) => !isSearch(c))!;
    expect(JSON.stringify(writing.messages)).toContain("not specified");
  });

  it("retries once when a reply can't be read, then succeeds", async () => {
    liveEnv();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let writes = 0;
    const fake = fakeClient((params) => (isSearch(params) ? searchMessage("https://acme.example/r", "Q.") : ++writes === 1 ? { content: [{ type: "text", text: "Could you tell me more about the product?" }] } : textMessage(mockPlaybook(inputs()))));
    setAnthropicClientForTests(fake.client);
    const p = await waitForPlaybook((await createPlaybook(inputs({ goal: "Retry" }), [], visitor())).id);
    expect(p.status).toBe("done");
    expect(writes).toBe(2);
    expect(errors.mock.calls.flat().join(" ")).toContain("Could you tell me more");
    errors.mockRestore();
  });

  it("gives up after one retry with a clear message", async () => {
    liveEnv();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = fakeClient((params) => (isSearch(params) ? searchMessage("https://acme.example/p", "Q.") : { content: [{ type: "text", text: "No." }] }));
    setAnthropicClientForTests(fake.client);
    const p = await waitForPlaybook((await createPlaybook(inputs({ goal: "Prose" }), [], visitor())).id);
    expect(p.status).toBe("error");
    expect(p.error).toMatch(/unexpected format/);
    expect(fake.calls.filter((c) => !isSearch(c))).toHaveLength(2);
    errors.mockRestore();
  });

  it("explains failures in plain language", () => {
    expect(friendlyError(new BudgetExceededError())).toMatch(/usage limit/);
    expect(friendlyError(Object.assign(new Error("x"), { status: 429 }))).toMatch(/busy/);
    expect(friendlyError(Object.assign(new Error("x"), { status: 503 }))).toMatch(/temporary/);
  });
});

describe("thumbnails (no AI cost)", () => {
  it("derives YouTube thumbnails and reads og:image", () => {
    expect(youtubeThumbnail("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(youtubeThumbnail("https://youtu.be/dQw4w9WgXcQ")).toContain("dQw4w9WgXcQ");
    expect(youtubeThumbnail("https://example.com")).toBeNull();
    expect(ogImageFromHtml('<meta property="og:image" content="/img/card.png">', "https://site.com/a")).toBe("https://site.com/img/card.png");
    expect(ogImageFromHtml('<meta property="og:image" content="http://insecure.com/x.png">', "https://site.com")).toBeNull();
  });
});

describe("stale jobs", () => {
  it("marks a playbook interrupted by a restart as failed", async () => {
    const db = await getDb();
    await db.insert(schema.playbooks).values({ id: "stalejob1", inputHash: "h", inputs: inputs(), status: "running", createdAt: new Date(Date.now() - 20 * 60_000) });
    const p = await getPlaybook("stalejob1");
    expect(p?.status).toBe("error");
    const [row] = await db.select().from(schema.playbooks).where(eq(schema.playbooks.id, "stalejob1"));
    expect(row.status).toBe("error");
  });
});
