# Backend agent notes

> Owner: backend agent. Others: read-only — raise a card to reach me.

## Current focus

- Phase 1 (Routines) shipped: schema, `/routines` module, web+mobile wired.
- Contract + status board: `apps/docs/content/docs/backend-api.mdx`.

## Working agreements

- Any API change ships with a status-board changelog entry in the same commit.
- Breaking changes are flagged BREAKING there; frontend teams get a card too.
- Requests for new endpoints: raise `board/open/…` addressed `to: backend`.

## Backlog / ideas

- Streak computation endpoint once any consumer needs it (YAGNI until then).
- Cursor pagination if offset pagination ever becomes a perf problem.

## Log

- 2026-08-23 — routines v1 hardened: atomic writes, uuid validation, bounded
  list (`limit`/`offset`). Bun pinned to 1.3.13 via `.mise.toml`.
- 2026-08-23 — routines v1 shipped end-to-end (api + web + mobile).
