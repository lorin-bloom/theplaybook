/** One small live web-search call; prints usage and cited passages (parser/model check). Usage: MODEL=... npx tsx --env-file=.env.local scripts/debug-search.mts */
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();
const msg = await client.beta.messages
  .stream({
    model: process.env.MODEL ?? "claude-haiku-5-5",
    max_tokens: 4000,
    output_config: { effort: "low" },
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 2 }],
    messages: [{ role: "user", content: "Research: Notion AI pricing and positioning for startups; Microsoft 365 Copilot positioning versus Notion AI. Write short factual findings; every sentence must cite search results." }],
  })
  .finalMessage();
console.log("model:", msg.model, "stop:", msg.stop_reason, "in:", msg.usage.input_tokens, "out:", msg.usage.output_tokens, "searches:", msg.usage.server_tool_use?.web_search_requests);
let n = 0;
for (const b of msg.content) {
  if (b.type === "text" && b.citations) for (const c of b.citations) if (c.type === "web_search_result_location") console.log(`${++n}. ${c.url} — “${c.cited_text.slice(0, 110)}”`);
}
console.log("citations:", n);
