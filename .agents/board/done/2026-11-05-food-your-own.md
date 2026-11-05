---
id: pos-53
title: Food your own way: recipes, groceries, meal plan and water
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: null
depends_on: []
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/src/modules/food/**", "apps/mobile/src/app/(home)/food/**", "apps/mobile/src/components/ui/{checkbox,text-field}.tsx", "apps/mobile/src/modules/home/lib/{module-sections,photo-targets}.ts", "apps/mobile/src/modules/finance/lib/finance-lib.test.ts", "packages/domain/src/food/model.ts", "apps/api/src/modules/ai/{food.schema,food.tasks,ai.routes}.ts", "apps/api/test/ai.test.ts", "apps/docs/content/docs/production-roadmap.mdx"]
allowed_shared: []
created: 2026-11-05
updated: 2026-11-05
---

## What

The owner found recipes hard to use (checkboxes had no visible circle), wanted to add their own
recipes with photos, steps and a video, their own groceries with details, a meal plan they can
build or have AI make, a better water card, and small touches throughout.

## Done

- Checkbox: an empty circle with a visible ring when unchecked (app-wide). Text fields shrink in a
  row (no sideways scrolling on the web).
- Your own recipes (`food-my-recipes`): editor with photo, name, AI first draft, meals, minutes,
  serves, numbers per serving, cost, ingredients, steps with minutes, video link, note and tags;
  "make it your own" copies a bundled recipe. They join the bundled ones through a registry in
  `recipes.ts`, so the plan, groceries, cook mode and Today find them.
- Recipe page: stat tiles, "Tick what you already have", add the missing to groceries, steps you
  tick as you cook, Watch the video / Find a video, your note, Edit.
- Recipes: always-on search, My recipes filter, write-your-own banner, hearts and "Yours" on tiles.
- Groceries: items by hand (photo, amount, aisle, price, note, at home), quick add, x of y bought,
  Clear ticked; hand-added items survive a remake from the plan; own recipes shop as written.
- Meal plan: build it yourself (pick per meal with servings), fill empty meals, start over, plan
  with AI from wishes (`/ai/food/plan-week`), repeat a day, clear the week.
- Water: a glass that fills, pace through the day, glass and bottle buttons, own amount, seven
  days and a streak.
- API: `/ai/food/draft-recipe` and `/ai/food/plan-week` (only known recipes and asked days kept).

## Validation

- mobile `bun test` 330 pass; domain 13 pass; API 121 pass against local Postgres 16.
- typecheck 6/6, oxlint 0 warnings, architecture and naming OK.
- Web export walked: water card, recipes, the editor (two ingredients, two timed steps), the saved
  recipe, add missing to groceries, building a plan by hand, adding a grocery by hand.
