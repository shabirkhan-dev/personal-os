---
id: pos-27
title: Food module rebuilt from the Figma Food section
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude
reviewer: human
parent: none
depends_on: [pos-25]
branch: agent/mobile/food-module
worktree: none
scope: ["apps/mobile/src/modules/food/**", "apps/mobile/src/app/(home)/food/**", "apps/mobile/assets/food/**", "apps/mobile/src/modules/home/**", "apps/mobile/app.json", "apps/mobile/package.json", "apps/api/src/modules/ai/**", "apps/api/test/**", "apps/docs/content/docs/**"]
allowed_shared: []
created: 2026-10-16
updated: 2026-10-16
---

## What

Food from the Figma Food section (359:409), replacing the first Food version:

- Home: hero "Food · lean bulk, week 3" with today's calories; ask bar with Photo, Say it and
  Barcode; macros, weight toward the goal (tap to weigh in), water and the five meal slots with
  photos and Log for planned meals. The empty state picks a goal and shows its targets.
- Log meal: photo, the line said or typed, matched items with quantities, totals and the slot.
- Meal plan for the week with calories and cost, and the grocery list from it.
- Recipes with a pick for the next meal, recipe detail with portions, at-home ingredients and
  cook mode that reads steps aloud with timers.
- Insights: the week's recap and what's worth changing.
- Goal and targets screen.

## Proposal or Ask

- Everyday foods (mostly Pakistani home food) are matched on the phone; the Food AI
  (`POST /ai/food/read-meal`) reads only what's left. `POST /ai/food/ask` answers "what should I
  eat". DeepSeek reads text only, so a meal photo is kept with the meal, not sent.
- Targets: Mifflin–St Jeor × activity, adjusted for the goal; estimates the person can change.
- Barcodes are read with `expo-camera` and looked up in Open Food Facts from the phone.
- Data lives in seven record-store collections and syncs. The old "food" file is moved into
  them once and removed.
- Recipe photos come from the Figma frames and are bundled.

## Scope

**Out of scope:** meal photos to R2, linking run days from Workout.

## Validation

- Lint, format and typecheck: clean.
- Mobile tests: 250 pass, including 20 for Food.
- API tests: 55 pass.
- `expo export --platform android`: bundles.
- `expo-camera` is a new native module, so this needs a new build, not an update.
