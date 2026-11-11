# Project status — The Playbook

_Last updated: 2026-11-11._

## What it is now
The project was rebuilt at the user's request: GTM Intelligence became **"The Playbook"**.
- A public, no-sign-up tool: one form → one visual, seven-section report at `/p/[id]`.
- Accounts, dashboard, projects, libraries and the tabbed workspace were removed. The old multi-section engine lives only in git history (the project isn't under git yet).
- Live-verified on 2026-11-11 with a Duolingo Max playbook: about $0.09 total ($0.04 Haiku research with 4 searches, $0.05 for one Sonnet writing call). All 7 sections rendered, with 7 real link thumbnails.

## Key files
- `src/lib/playbook/`: `schema.ts` (report contract), `prompt.ts` (system prompt + JSON shape), `generate.ts` (pipeline, dedupe, stale-job handling), `limits.ts` (visitor, daily and monthly caps), `provenance.ts`, `thumbnails.ts`, `examples.ts` (the free ChatGPT Business example), `markdown.ts`.
- `src/lib/research/`: `research.ts` (2 topic batches, cache, dedupe), `providers.ts` (Tavily, or Anthropic basic web search).
- `src/components/playbook/`: `Form.tsx`, `Board.tsx` (the strategy board), `mocks.tsx` (post, video, email, event and podcast mockups, plus link previews), `Progress.tsx`.
- `/admin` (Basic auth via `src/middleware.ts` and `ADMIN_PASSWORD`).

## Gotchas learned live
- Strict structured outputs reject this schema ("compiled grammar is too large"). The playbook call uses `jsonMode: "prompt"` (shape described in the prompt) with tolerant Zod `.catch()` fallbacks.
- `web_search_20260209` returns uncited prose. Use `web_search_20250305`, which returns citations.

## Next ideas
- Add `TAVILY_API_KEY` (free tier) to cut cost to about $0.05 per playbook.
- Optional: Cloudflare Turnstile on the form; add more example playbooks.
