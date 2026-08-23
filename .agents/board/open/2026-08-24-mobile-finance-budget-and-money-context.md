---
from: human
to: mobile
priority: high
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Make finance month, currency, and replacement mutations safe

## Context

The finance UI currently derives the month from the device timezone, defaults
all formatting/prompts to INR, and formats unknown currencies as INR. A user
whose profile timezone or currency differs from the device can see the wrong
month or misleading amounts. The budget modal can also submit a full replacement
while the existing budget query is still loading, turning `budgets ?? []` into
an accidental wipe of the month’s existing limits.

The amount form rounds arbitrary decimal input to minor units without rejecting
values that round to zero, while the API requires transaction `amountMinor >= 1`.

## Requested outcome

Use an explicit user finance context for month and currency, validate minor-unit
boundaries before submission, and make whole-month budget replacement impossible
until the current set is loaded and intentionally edited.

## Definition of done

- Month selection follows the documented user timezone or is explicitly chosen.
- Currency comes from a documented account/transaction context and uses a
  correct formatter for supported currencies.
- Amounts that produce invalid minor units are rejected with field feedback.
- Budget writes preserve existing categories and support intentional clearing.
- Tests cover timezone boundary, currency formatting, zero/rounding, loading, and
  replacement failure cases.

## Resolution

(open)
