# The Playbook — notes for Claude Code

- Read `STATUS.md` first, then `README.md`.
- Verify with `npm run lint && npm run typecheck && npm test`. Tests never hit the network; use `fakeClient` in `tests/helpers/setup.ts`.
- `AI_MODE=mock` for UI work. Never make live API calls in tests or builds.
- Keep it to ONE writing call per playbook. Expandable detail must be produced in that call, not fetched later.
- Keep the example playbook (`src/lib/playbook/examples.ts`) limited to verifiable public sources and labelled as a concept demo.
