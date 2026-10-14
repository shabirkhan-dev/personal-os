---
id: pos-19
title: Home screens from Figma (Finance, Workout, Skincare, Food, Profile) on real data
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: [pos-18]
branch: ccr-f7a44e55-46aj0i
worktree: none
scope: ["apps/mobile/**", "bun.lock"]
allowed_shared: ["bun.lock"]
created: 2026-10-14
updated: 2026-10-14
---

## What

Build the Home page frames from Figma (Kit v2 file, page "Home"): module Homes for Finance
(67:438), Workout (67:681), Skincare (226:1293), Food (177:1166) with Recipes (181:1232) and Recipe
detail (182:1270), and Profile (163:1583). Move the header up to just below the status bar and the
tab bar down to just above the home indicator. Everything must work on what the person enters.

## Resolution

- Today switches between Overview and each module Home from the picker; the choice is remembered.
  Header per module: glow, right button, hero number (money can be hidden).
- On-device JSON document stores (expo-file-system) per module; sheets for entry; typed ask-bar
  lines are parsed into entries ("500 food", "45 min gym", "lunch biryani 700").
- Finance: budget, today spending by category, daily average/low/peak, savings goal; receipt photo
  attaches to an expense (reading totals is "Soon").
- Workout: live session timer, runs, training score, workout-days grid, energy check-ins; steps from
  the iOS pedometer ("Soon" on Android, which has no step history).
- Skincare: editable AM/PM routine with ticks and streak, skin check-ins with camera photo,
  products with time left and restock, a tip from what was logged (no invented UV index).
- Food: macro targets from the plan, water, four meal slots, dinner idea from 14 bundled recipes,
  photo / dictation logging (barcode "Soon"), Recipes and Recipe detail screens.
- Profile: OS Card, manage modules, real microphone permission, JSON export, sync state, theme
  (persisted), units, week start, sign in/out, replay onboarding; unbuilt devices say "Soon".

Validation: typecheck clean, oxlint 0 warnings, 173 mobile tests pass, architecture and naming
checks pass. Needs a new EAS build (expo-file-system, expo-image-picker, expo-sensors). Not run on
a device from here.
