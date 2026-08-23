---
from: human
to: all
priority: normal
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Replace finance demo state with the v1 API

## Context

Finance v1 is ready and documented, but the web app has no finance consumer and
the mobile expenses screens still read/write hardcoded in-memory Zustand data.
That leaves clients showing data that is not the authenticated user’s backend
data and makes transaction/budget changes disappear on reload.

Contract: `apps/docs/content/docs/backend-api.mdx` (`/finance/transactions`,
`/finance/budgets/:month`, and `/finance/summary/:month`).

## Requested outcome

Add typed web/mobile finance clients and wire the visible finance surfaces to
the documented endpoints. Keep money in integer minor units at the API
boundary, handle loading/error/empty states, and remove demo data from shipped
user flows.

## Definition of done

- Authenticated web and mobile users read/write their server-backed finance data.
- Transaction, budget, and summary responses use the documented envelopes.
- Create/update/delete and month changes have tests or focused regression
  coverage in each client.
- Any missing backend field is raised against the API contract rather than
  silently mocked in the client.

## Resolution

(open)
