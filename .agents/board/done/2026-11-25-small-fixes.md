---
id: pos-60
title: Small fixes - row switches, your own meals, your own minimum day, empty Recipes, chip contrast
type: fix
from: human
to: mobile
priority: medium
status: done
assignee: claude-code
reviewer: human
parent: null
depends_on: [pos-59]
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/src/**", "packages/domain/src/food/**"]
allowed_shared: []
created: 2026-11-25
updated: 2026-11-25
---

## Done

- `ToggleRow` (components/ui): the whole row flips the switch; used in Reminders, Backup and
  Security (the E2E run found the row didn't respond).
- Food: the meals tracked each day are the person's (`FoodSettings.meals`, empty for new people,
  all five kept for older set-up settings); Today's meals shows only those plus anything logged
  or planned, with "Edit" and a "Pick my meals" empty state.
- Daily: the minimum day takes the person's own items (`own`, ids `c-…`, ticked by hand), with
  module ideas listed below them.
- Recipes: search and filters hide until there's a recipe.
- `FilterChip`: an outline when not selected, so it shows on cards as well as the screen.

## Validation

- mobile 354 pass; domain 18 pass; typecheck and oxlint clean.
- Web export: meals sheet with outlined chips, minimum picker with "Call mum" added.
