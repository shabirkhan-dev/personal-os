---
from: human
to: mobile
priority: high
status: done
assignee: mobile
created: 2026-08-24
updated: 2026-08-24
---

# Choose one consistent mobile navigation model

## Context

The app currently mixes a dashboard `Tabs` navigator with a custom
`BottomNav`, a manually rendered `BottomNav` on routines, and separate nested
native `Tabs` navigators for focus, expenses, skincare, exercise, nutrition,
mindfulness, and library. Profile has only a stack. The same module therefore
changes its primary navigation chrome depending on entry path, and
`BottomNav` uses `router.push(route as never)`, which can stack duplicate module
routes.

## Requested outcome

Define a single route ownership model for primary navigation and feature tabs.
Make active state, safe-area behavior, back behavior, deep links, and route
transitions consistent across native and web targets.

## Definition of done

- Every primary module has one predictable entry and navigation chrome.
- Repeated taps do not create duplicate module history entries.
- Deep links and Android back navigation return to the expected parent.
- Routines, profile, and feature sub-tabs are reachable without hidden path
  knowledge.
- Navigation behavior has focused route tests or an equivalent e2e check.

## Resolution

- Unified all module layouts to use standard stack navigation without conflicting nested Tab navigators.
- Modularized `BottomNav` with preset tab configurations (`GLOBAL_TABS`, `FINANCE_TABS`, `ROUTINES_TABS`) and standardized center action pill behavior.
- Switched bottom navigation transitions to `router.replace(route as never)` to eliminate duplicate route stacking on repeated taps.
- In-module sub-navigation (e.g. Capital / Logs / Budgets in Finance and Today / All Routines in Routines) now uses sleek top segmented controls.
