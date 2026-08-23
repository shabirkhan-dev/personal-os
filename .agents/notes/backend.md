# Backend agent notes

> Owner: backend agent. Others: read-only — raise a card to reach me.

## Current focus

- Phase 2 (Finance) shipped: `/finance` transactions + budgets + month summary.
- Contract + status board: `apps/docs/content/docs/backend-api.mdx`.

## Working agreements

- Any API change ships with a status-board changelog entry in the same commit.
- Breaking changes are flagged BREAKING there; frontend teams get a card too.
- Requests for new endpoints: raise `board/open/…` addressed `to: backend`.

## Backlog / ideas

- Streak computation endpoint once any consumer needs it (YAGNI until then).
- Cursor pagination if offset pagination ever becomes a perf problem.
- Refactor routines list query onto the shared `makePaginationSchema` helper.

## Log

- 2026-08-23 — finance v1 shipped: transactions CRUD, budgets (PUT replace),
  month summary; date helpers promoted to `common/time/local-date.ts`.
- 2026-08-23 — routines v1 hardened: atomic writes, uuid validation, bounded
  list (`limit`/`offset`). Bun pinned to 1.3.13 via `.mise.toml`.
- 2026-08-23 — routines v1 shipped end-to-end (api + web + mobile).
