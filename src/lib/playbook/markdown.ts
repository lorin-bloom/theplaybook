import type { PlaybookReport, PlaybookSource } from "./schema";

const refs = (r: string[] | string | null) => {
  const list = (Array.isArray(r) ? r : r ? [r] : []).filter(Boolean);
  return list.length ? ` [${list.join(", ")}]` : "";
};

export function playbookToMarkdown(r: PlaybookReport, sources: PlaybookSource[], isExample = false): string {
  const out = [
    `# The Playbook: ${r.productName}`,
    r.oneLiner,
    isExample ? "> Concept demo built from public sources. Independent strategy, not affiliated with the company." : "",
    `## 1. The Opportunity\n**${r.opportunity.headline}**\n\n- Audience: ${r.opportunity.audience}\n- Problem: ${r.opportunity.problem}\n- Why now: ${r.opportunity.whyNow}`,
    `## 2. The Positioning\n**${r.positioning.valueProposition}**\n\n${r.positioning.differentiator}\n\n${r.positioning.pillars.map((p) => `- **${p.name}** — ${p.line}`).join("\n")}`,
    `## 3. The Big Idea: ${r.bigIdea.campaignName}\n*${r.bigIdea.hook}*\n\n${r.bigIdea.concept}\n\n**Look & feel:** ${r.bigIdea.visualDirection}\n\n**Example (${r.bigIdea.example.format}):** ${r.bigIdea.example.headline} — ${r.bigIdea.example.body} (${r.bigIdea.example.cta})`,
    `## 4. Where to Show Up\n${r.channels.map((c, i) => `${i + 1}. **${c.platform}** — ${c.tactic} (${c.format}, ${c.cadence}; KPI: ${c.kpi})${refs(c.exampleRef)}`).join("\n")}`,
    `## 5. Dream Collaborators\n${r.collaborators.map((c) => `- **${c.name}** (${c.type}) — ${c.why} Activation: ${c.activation}${refs(c.sourceRefs)}`).join("\n")}`,
    `## 6. The Story Worth Telling\n**${r.story.angle}**\n\n${r.story.whyInteresting}\n\n> “${r.story.sampleHeadline}”\n\n${r.story.opportunities.map((o) => `- ${o.outlet} — ${o.why}${refs(o.sourceRef)}`).join("\n")}`,
    r.launch ? `## The Launch\n**${r.launch.when}:** ${r.launch.moment}\n\n${r.launch.hype.map((h) => `- ${h.when}: ${h.move}`).join("\n")}\n\n> ${r.launch.post}` : "",
    `## 7. The Game Plan\n${r.gamePlan.actions.map((a, i) => `${i + 1}. ${a.action} — ${a.why}`).join("\n")}\n\n${r.gamePlan.timeline.map((t) => `- ${t.when}: ${t.focus}`).join("\n")}\n\n**KPIs:** ${r.gamePlan.kpis.map((k) => `${k.name} (${k.target})`).join("; ")}`,
    r.assumptions.length ? `### Assumptions\n${r.assumptions.map((a) => `- ${a}`).join("\n")}` : "",
    sources.length ? `### Sources\n${sources.map((s) => `- ${s.ref}: ${s.title}${s.url ? ` — ${s.url}` : ""}`).join("\n")}` : "",
  ];
  return out.filter(Boolean).join("\n\n");
}
