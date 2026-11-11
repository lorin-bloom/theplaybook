/** Deterministic development fixture (AI_MODE=mock). Every string is labelled. */
import type { PlaybookInputs, PlaybookReport } from "./schema";

const M = (s: string) => `[Dev mock] ${s}`;

export function mockPlaybook(i: PlaybookInputs): PlaybookReport {
  const hyp = (t: string) => ({ text: M(t), status: "hypothesis" as const, sourceRefs: [] });
  return {
    productName: i.product,
    oneLiner: M("What the product is"),
    opportunity: { headline: M(`Win ${i.audience || "early adopters"} by solving their most painful workflow first.`), audience: M("Priority audience"), problem: M("Core problem"), whyNow: M("Why now"), rationale: [M("Reason one"), M("Reason two")], evidence: [hyp("Evidence")] },
    positioning: { valueProposition: M("The one-line promise"), differentiator: M("What only we do"), pillars: [1, 2, 3].map((n) => ({ name: M(`Pillar ${n}`), line: M("Supporting line") })), proof: [hyp("Proof")] },
    bigIdea: { campaignName: M("Campaign Name"), hook: M("A memorable hook"), concept: M("Concept"), visualDirection: M("Visual direction"), example: { format: "LinkedIn carousel", headline: M("Example headline"), body: M("Example body copy."), cta: "Try it free" }, whyItWorks: M("Why it works"), steps: [M("Step one"), M("Step two"), M("Step three")], inspirationRef: null, inspirationNote: M("What to borrow") },
    channels: ["LinkedIn", "YouTube", "Newsletters"].map((p, n) => ({ platform: p, role: M("Role"), tactic: M("Tactic"), format: M("Format"), audience: M("Audience"), cadence: "Weekly", kpi: M("KPI"), mock: { kind: n === 1 ? ("long_video" as const) : n === 2 ? ("email" as const) : ("social_post" as const), headline: M("Sample headline"), body: M("Sample post copy.") }, exampleRef: null, exampleNote: M("What to borrow"), steps: [M("Step")] })),
    collaborators: (["partner", "creator", "community"] as const).map((t, n) => ({ name: M(`Collaborator ${n + 1}`), type: t, why: M("Why"), activation: M("Activation"), sourceRefs: [] })),
    story: { angle: M("Story angle"), whyInteresting: M("Why it matters"), sampleHeadline: M("A headline a journalist might write"), opportunities: [{ outlet: M("Outlet"), why: M("Why"), sourceRef: null }], risks: [M("Risk")], evidence: [hyp("Evidence")] },
    gamePlan: { actions: [1, 2, 3].map((n) => ({ action: M(`Action ${n}`), why: M("Why") })), timeline: ["Weeks 1–2", "Weeks 3–6", "Weeks 7–12"].map((w) => ({ when: w, focus: M("Focus") })), kpis: [1, 2, 3].map((n) => ({ name: M(`KPI ${n}`), target: M("Target") })) },
    assumptions: [M("Assumption")],
  };
}
