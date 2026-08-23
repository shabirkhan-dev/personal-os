---
from: human
to: mobile
priority: normal
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Make mobile forms and destructive actions domain-safe

## Context

`AddEntryModal` is a generic four-string form reused for expenses, meals,
tasks, books, skincare, and journals. It accepts whitespace titles, has no
domain validation or keyboard scroll container, closes immediately without an
async save/error state, and does not expose input semantics. The same
`LogListItem` is used as an immediate delete action, so tapping a content row
removes data without confirmation, undo, or a destructive affordance.

## Requested outcome

Replace the generic modal with domain-owned schemas and submission states. Make
destructive actions explicit and recoverable, while keeping the shared form
primitives reusable.

## Definition of done

- Empty/invalid input is rejected before persistence with field-level feedback.
- Keyboard behavior works on small devices and submission cannot double-fire.
- Server/local save failures keep user input and show recovery feedback.
- Delete requires an intentional destructive action and offers confirmation or
  undo.
- Money, dates, units, and domain values use typed representations rather than
  display strings.

## Resolution

(open)
