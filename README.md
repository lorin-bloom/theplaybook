# the playbook.

**A smarter go-to-market plan, in minutes.** Tell it what you're marketing, who it's for and what you want to achieve, optionally attach documents, and get a one-page, visual go-to-market playbook. There is no sign-up and no setup.

The report has seven sections, laid out as a creative strategy board:

1. **The Opportunity:** where to focus and why
2. **The Positioning:** the value proposition, three pillars and the key differentiator
3. **The Big Idea:** a named campaign, its hook, the look and feel, and a mock creative
4. **Where to Show Up:** three ranked platforms, each with a tactic, a mock post or video, and a real example link with its thumbnail
5. **Dream Collaborators:** three partners, creators or communities, with the ask
6. **The Story Worth Telling:** the press angle, a sample headline and media opportunities
7. **The Game Plan:** three actions, a timeline and three KPIs

Each section has a one-line headline, and the reasoning, steps and evidence sit behind "Why this →". Visitors can share the link, print to PDF or download Markdown. A pre-made **example playbook** (ChatGPT Business) costs nothing to view.

---

## Run it

```bash
npm install
cp .env.example .env.local    # add ANTHROPIC_API_KEY (and ideally TAVILY_API_KEY)
npm run dev                   # http://localhost:3000
```

There's no database to install: it uses embedded PGlite (Postgres in WASM) in `.data/`. In production, set `DATABASE_URL` to any Postgres; migrations run automatically.

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | 24 tests; fake AI clients and in-memory DB, so no network and no spend |
| `npm run lint` / `typecheck` | Static checks |
| `AI_MODE=mock npm run dev` | UI work with labelled placeholder output and zero API calls |

`/admin` shows spend, average cost per playbook, a cost breakdown by operation, and recent playbooks. It is protected by HTTP Basic auth with `ADMIN_PASSWORD`; any username works.

---

## How it works

```
form ─▶ /api/playbooks ─▶ dedupe? ─▶ caps ─▶ background pipeline ─▶ /p/[id]
                                                │
   research (2 topic batches, cached) ──────────┤  public queries only
   ONE writing call (Sonnet, medium effort) ────┤  whole report incl. details
   provenance check ────────────────────────────┤  links must be real results
   link-preview thumbnails (og:image) ──────────┘  fetched from pages, no AI
```

- **Research** uses Tavily if `TAVILY_API_KEY` is set. Otherwise it uses Claude Haiku with the web-search tool; only the passages the tool actually returned are kept, so links can't be invented. Search queries are built from the product name and audience only; the private description and uploaded documents never go to a search provider. Results are cached for 14 days and shared across playbooks.
- **Writing:** a single call produces all seven sections plus the expandable detail. The exact JSON shape is described in the prompt, because this schema is too large for strict structured outputs. The response is validated with tolerant Zod parsing: unknown enum values fall back to defaults.
- **Provenance:** every link (`exampleRef`, `inspirationRef`, `sourceRefs`) must be one of the research handles; anything else is stripped. Claims without a source are shown as "our view", never as "verified".
- **Uploads:** PDF, DOCX, TXT, Markdown and CSV, up to 3 files of 5 MB each. They are read in memory and never stored; about 40k characters of text are passed to the writing call, with a note if a document was truncated. Uploaded text is treated as untrusted data (prompt-injection defences).
- **Safety:** an SSRF-guarded fetcher for previews, per-visitor rate limits based on a salted IP hash (the raw IP is never stored), security headers, and unguessable playbook IDs that aren't indexed by search engines.

## Cost: built for a public portfolio demo

Measured live on 2026-11-11 (Duolingo Max, without Tavily): **about $0.09 per new playbook.** That was $0.04 for research (4 searches) and $0.05 for the single writing call. With Tavily's free tier, research is about $0, so a playbook costs **about $0.05**.

| Lever | Effect |
|---|---|
| One writing call instead of a chain of calls | The research isn't re-sent repeatedly; the biggest saving |
| Details written in the same call | Opening "Why this" costs nothing |
| Tavily free tier, or Haiku with 2 searches per batch | Research costs $0–0.04 |
| Research cache (14 days, shared) | Same product again costs only the writing call |
| Identical inputs return the saved playbook | Repeats cost $0 and don't count toward limits |
| Pre-made example playbooks | Most visitors cost $0 |
| Thumbnails and mockups drawn from data | No image-generation cost |
| Caps: 3 per visitor per day, 40 per day, `MONTHLY_BUDGET_USD` hard stop | Worst case is bounded; the budget is checked again before every paid call |

At the default caps, the absolute worst month is the `MONTHLY_BUDGET_USD` you set (default $15). That's about 160–300 playbooks.

## Deploy

The app needs a long-lived Node server, because generation runs in the background for about 30–60 seconds. Railway, Render, Fly.io or a small VM all work.

1. Set `ANTHROPIC_API_KEY`, `TAVILY_API_KEY` (recommended), `ADMIN_PASSWORD`, `HASH_SALT` (any random string), `MONTHLY_BUDGET_USD`, and `DATABASE_URL` (Postgres).
2. `npm ci && npm run build && npm start`.
3. Behind a proxy, make sure `X-Forwarded-For` carries the client IP, so per-visitor limits work.

The rate limiter and background jobs run in-process. For multiple instances, use Redis for rate limiting and a queue for jobs.

## Limitations

- Visitor limits are per IP, so a determined abuser could rotate IPs. The global daily and monthly caps still bound total spend. Adding Cloudflare Turnstile would add bot protection.
- Thumbnails depend on sites exposing `og:image`; cards fall back to a styled link.
- The example playbook is hand-curated from public sources, as an independent concept.
