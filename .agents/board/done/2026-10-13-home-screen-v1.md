---
id: pos-5
title: Home screen v1 from the Figma Kit v2 file
type: feature
from: pm
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: []
branch: ccr-f7a44e55-46aj0i
worktree: none
scope: ["apps/mobile/src/app/(home)/**", "apps/mobile/src/modules/home/**"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

Replace the placeholder home with the real home screen designed in Figma Kit v2, built from the user's onboarding plan.

## Why / Context

After onboarding the app shows only a greeting and a Replay button.

## Proposal or Ask

Owner points to the Figma home frames (file `3KjKY0nbjCHqKZb0xRhWIh`). Build with tokens and Kit v2 components; read data from the onboarding store until the API exists. Done when it matches the frames in Dark and Light.

## Scope

**In scope:** `apps/mobile/src/app/(home)/**`, `apps/mobile/src/modules/home/**`

**Out of scope:** anything not listed above; raise a card instead.

## Validation

- mobile lint, typecheck, test
- screenshots in Dark and Light vs Figma

## Resolution

Built **Home · Overview** and **Home · Module picker** from the Figma page "Home" (frames 37:579, 71:1006).

Changed:
- `apps/mobile/src/app/(home)/index.tsx`: the screen
- `apps/mobile/src/modules/home/**`: header, money card, ask bar, upcoming list, floating tab bar, module picker; `lib/today.ts` (timeline, next item, module statuses) with tests
- onboarding answers are now saved on finish and restored on launch (`answers-storage.ts`), so Home survives a restart
- `PlanRow.minutes`; `elevation.tabBar` token; avatar initials scale down at small sizes

No invented data: the budget shows "Not set", Upcoming comes from the onboarding plan and reminders, and the module rows describe the plan. Elements with nothing behind them yet are honest about it: the ask bar says logging arrives with the account, Insights is disabled, Areas and the Apps button open the picker, and Profile opens a menu with Replay onboarding. The Play/Pay buttons from the frame are left out until there is an action to run.

Validation:
- mobile typecheck, lint: clean; `bun test`: 23 pass
- web export screenshots in Dark and Light, plus the picker, compared with the Figma frames

Follow-up: pos-11 (module dashboards: Finance, Workout, Skincare frames).
