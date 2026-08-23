---
from: human
to: backend
priority: normal
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Close finance budget validation gaps

## Context

The budget replacement DTO requires at least one budget, so callers cannot
clear a month by submitting an empty set. It also permits categories that only
differ by case; after normalization, the database can reject the duplicate and
surface a server error instead of a validation error.

Relevant code: `apps/nest-api/src/modules/finance/finance.dto.ts` and the
finance contract in `apps/docs/content/docs/backend-api.mdx`.

## Requested outcome

Allow an empty replacement set and reject duplicate categories after the same
lowercase/trim normalization used by persistence. Keep invalid amounts and
categories in the existing validation envelope.

## Definition of done

- `PUT /finance/budgets/:month` can clear all budgets for a month.
- Case/whitespace-equivalent duplicate categories return a 4xx validation
  response rather than a database 5xx.
- DTO and endpoint tests cover empty, duplicate, and valid replacement sets.
- The API docs describe the empty-set behavior.

## Resolution

(open)
