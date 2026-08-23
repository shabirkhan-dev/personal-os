---
from: human
to: mobile
priority: normal
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Replace seeded demo state with domain data boundaries

## Context

Most mobile modules read from `src/store/use-app-store.ts`, which seeds
hardcoded personal records and supports only in-memory add/delete operations.
Reloading the app restores the demo data, and the screens have no repository,
loading, error, retry, or offline state. The existing finance integration card
covers finance v1; this card covers the remaining skincare, exercise, nutrition,
mindfulness, focus, and library surfaces and the shared store pattern.

## Requested outcome

Give each domain an explicit typed repository/service boundary and a declared
server-backed or offline-first persistence strategy. Keep mock fixtures isolated
to previews/tests rather than production state initialization.

## Definition of done

- Shipped screens never silently reseed demo records for real users.
- Each domain documents ownership of local cache, API data, and mutations.
- Loading, empty, error, retry, and optimistic/offline states are designed per
  domain.
- State survives the chosen lifecycle and is isolated by authenticated user.

## Resolution

(open)
