---
from: human
to: mobile
priority: normal
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Remove or wire dead mobile interaction affordances

## Context

Several controls visually communicate that they are interactive but have no
behavior: dashboard `QuickAction`s have no handlers, OS header scan and
notification buttons have no handlers, most dashboard widgets are wrapped in
`Pressable` without `onPress`, recorder controls are inert, and the dashboard
and routines `BottomNav` center plus has no callback. The recently wired
spending widget is an example of the intended route/action pattern; the
remaining surfaces should follow it or become non-interactive.

## Requested outcome

Either connect each affordance to a real route/action or render it as a
non-interactive status surface. Do not leave press animations, notification
badges, or buttons that imply unavailable functionality.

## Definition of done

- Every `Pressable` in shipped screens has an intentional action or is removed.
- Disabled/future features are communicated honestly in the UI.
- Quick actions and module shortcuts have route/action tests.
- Press feedback and loading states do not imply success before persistence.

## Resolution

(open)
