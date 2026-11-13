import { getDb, resetDbForTests } from "@/lib/db";
import { getPlaybook } from "@/lib/playbook/generate";

export async function freshDb() {
  resetDbForTests();
  return getDb();
}

type FakeMessage = {
  model?: string;
  stop_reason?: string;
  content: unknown[];
  usage?: Partial<{ input_tokens: number; output_tokens: number; cache_read_input_tokens: number; cache_creation_input_tokens: number; server_tool_use: { web_search_requests: number } }>;
};

/** A fake Anthropic client: records every request and returns scripted messages. No network. */
export function fakeClient(respond: (params: Record<string, unknown>) => FakeMessage | Promise<FakeMessage>) {
  const calls: Record<string, unknown>[] = [];
  const client = {
    beta: {
      messages: {
        stream(params: Record<string, unknown>) {
          calls.push(params);
          return {
            async finalMessage() {
              const m = await respond(params);
              return {
                model: m.model ?? String(params.model),
                stop_reason: m.stop_reason ?? "end_turn",
                content: m.content,
                usage: { input_tokens: 1000, output_tokens: 500, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, ...m.usage },
              };
            },
          };
        },
      },
    },
  };
  return { client: client as never, calls };
}

export const textMessage = (obj: unknown): FakeMessage => ({ content: [{ type: "text", text: JSON.stringify(obj) }] });


export const searchMessage = (url: string, quote: string): FakeMessage => ({
  content: [
    { type: "web_search_tool_result", content: [{ type: "web_search_result", url, title: "Result", page_age: "2026-01-01" }] },
    { type: "text", text: "Finding.", citations: [{ type: "web_search_result_location", url, title: "A real page", cited_text: quote }] },
    { type: "text", text: "Uncited prose with an invented link https://fake.example — ignored." },
  ],
  usage: { server_tool_use: { web_search_requests: 2 } },
});

/** Waits for a background pipeline to finish. */
export async function waitForPlaybook(id: string, timeoutMs = 15_000) {
  const start = Date.now();
  for (;;) {
    const p = await getPlaybook(id);
    if (p && p.status !== "running") return p;
    if (Date.now() - start > timeoutMs) throw new Error("timeout");
    await new Promise((r) => setTimeout(r, 25));
  }
}
