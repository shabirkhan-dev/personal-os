---
from: human
to: mobile
priority: normal
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Establish a mobile accessibility baseline

## Context

Only parts of the app expose accessibility metadata. Shared controls such as
`AuthButton`, `FloatingActionButton`, `QuickAction`, `LogListItem`, profile
avatar/header actions, modal close/save controls, plan selectors, and interval
chips generally lack roles, labels, hints, or state. Icon-only header buttons
are especially difficult for screen-reader users to identify.

## Requested outcome

Make shared primitives carry sensible accessible defaults and require screen
specific labels/state for domain actions. Preserve the visible neon design while
meeting native hit-target, focus, contrast, and dynamic-text expectations.

## Definition of done

- Buttons, links, tabs, checkboxes, dialogs, and destructive actions expose
  correct roles, labels, and state.
- Icon-only controls have meaningful localized labels.
- Touch targets meet the platform minimum and remain usable with larger text.
- Accessibility checks cover auth, routines, profile/security, billing, and the
  primary dashboard flows on iOS/Android/web where supported.

## Resolution

(open)
