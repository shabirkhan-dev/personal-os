---
id: pos-29
title: Daily life, the hub, from the Figma Daily life section
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude
reviewer: human
parent: none
depends_on: [pos-28]
branch: agent/mobile/daily-life
worktree: none
scope: ["apps/mobile/src/modules/daily/**", "apps/mobile/src/app/(home)/daily/**", "apps/mobile/src/modules/{faith,career,food,care,workout,finance,fashion}/{index.ts,hooks/**}", "apps/mobile/src/modules/home/**", "apps/mobile/src/app/(home)/index.tsx", "apps/docs/content/docs/**"]
allowed_shared: []
created: 2026-10-16
updated: 2026-10-16
---

## What

Daily life from the Figma section (427:409), replacing the "coming soon" view:

- Home (the hub): hero "3 of 5" minimum day, ask bar with Plan day / Log / Close day or Sleep,
  Right now with Start focus and Later, the minimum day rings and streak, a tile per module with
  today's line, and the rest of today.
- Choose minimum day (3 to 5 things), Morning brief, Plan the day (drafted, editable, free time
  called out), Close the day (energy, one good thing, tomorrow), Sleep (week vs target, wind-down,
  alarms) and Insights.

## Proposal or Ask

- Each module exports one `use<Module>Day()` hook (Faith, Career, Food, Care, Workout, Fashion,
  plus Finance's spent today); Daily reads only those, never another module's storage.
- The streak is "never miss twice": one missed day doesn't end it, two in a row do. Each day's
  result is kept when the hub is open so past days keep their score.
- Alarms are local notifications: a one-off 10 minutes before Fajr, the nightly wind-down, and
  weekend wake-ups.
- Lines that belong to another module go there through the same routing as Talk to OS.

## Validation

- Lint, format and typecheck: clean.
- Mobile tests: 241 pass, including 10 for Daily life.
- `expo export --platform android`: bundles.
