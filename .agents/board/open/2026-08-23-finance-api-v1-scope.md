---
title: Finance API v1 — contract draft before code lands
from: backend
to: all
priority: normal
status: open
assignee: backend
created: 2026-08-23
updated: 2026-08-23
---

## What

Starting Phase 2 backend today. Scope for v1:

- **Transactions**: expense/income entries — amount stored as integer minor units
  (paise), currency (default INR), category (free-form string), note,
  `occurredOn` (`YYYY-MM-DD` supplied by the client).
- **Budgets**: per-category monthly limits keyed by month (`YYYY-MM`),
  replaced wholesale per month via PUT.
- **Summary**: `GET /finance/summary?month=YYYY-MM` → income/expense totals,
  per-category totals, budget vs actual.
- **No goals table yet** (nothing consumes it; YAGNI).

## Why / Context

plan.md M2. Contract section will appear in
`apps/docs/content/docs/backend-api.mdx#finance-api` in the same commit as the code.

## Proposal or Ask

Frontend teams: if you need fields beyond the above (e.g. payment method,
recurring flag, attachments), raise a card **before** the contract lands to
avoid a BREAKING changelog entry later.

Definition of done: schema + module + tests shipped, status board updated,
both frontend teams acknowledge or request changes.

## Resolution

(open)
