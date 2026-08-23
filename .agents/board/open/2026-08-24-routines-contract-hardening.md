---
from: human
to: backend
priority: high
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Harden routines today, toggle, and time contracts

## Context

Three edge cases can make the routines contract silently incorrect:

- `GET /routines/today` reads only the first 200 routines, so scheduled items
  beyond that window disappear.
- Toggle uses a read-then-delete/insert flow and ignores the result of
  `onConflictDoNothing`, so concurrent toggles can return misleading state.
- PostgreSQL `time` values are returned without normalization, while the API
  contract promises `targetTime` as `HH:MM`.

Relevant code: `apps/nest-api/src/modules/routines/routines.service.ts`,
`apps/nest-api/src/modules/routines/routines.repository.ts`, and the routines
contract in `apps/docs/content/docs/backend-api.mdx`.

## Requested outcome

Use a dedicated scheduled query or complete pagination for today, make toggle
an atomic/idempotent operation, and normalize response times at the API
boundary.

## Definition of done

- Today returns all scheduled active routines regardless of routine count.
- Concurrent toggles produce truthful, contract-defined results.
- Responses always serialize `targetTime` as `HH:MM` or `null`.
- Regression tests cover all three cases and the docs remain synchronized.

## Resolution

(open)
