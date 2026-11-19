---
id: pos-58
title: Template marketplace, nothing built in by default, Food layout fixes, bundled photos
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: pos-56
depends_on: [pos-57]
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/src/**", "apps/mobile/scripts/gen-bundled-photos.mjs", "apps/mobile/app.json", "apps/docs/content/docs/production-roadmap.mdx"]
allowed_shared: []
created: 2026-11-19
updated: 2026-11-19
---

## What

From the owner's device screenshots: recipe photos were blank, the recipe grid left a half
screen empty, Food's links wrapped onto a second line, and recipes were there by default. The
owner wants a template area to import from, and no module to show a single item by default.

## Done

- Built-in photos were 404 on the production bucket; all 150 (2 MB) now ship in the app through a
  generated require map (`src/lib/photos/bundled-photos.ts`), R2 stays the fallback.
- Templates marketplace (`/templates`, `/templates/[id]`): nine packs (recipes, training programs,
  Care routines, classic tasbih, flashcards, learning paths, challenges, budget split, wardrobe
  basics) with search, module filters, item previews, pick some or all, and "Added" states.
  Linked from Settings, each module's menu, and the empty Recipes, Programs and Grow screens.
- Nothing by default: recipes are only the person's (written or added from the pack, copied as
  `mine-tpl-*` with photo and grocery mapping); built-in programs only via the pack (one already
  being followed stays); Faith Grow shows only added paths; Training's first week no longer seeds
  starter skills; meal planning asks for recipes first.
- Food: links are one sideways-scrolling row (`QuickLinks`), the recipe grid is two equal columns
  sized to the screen, and recipe screens read the person's recipes from data (the React Compiler
  had cached `allRecipes()`).

## Validation

- mobile `bun test`: 353 pass, 0 fail (food tests add the recipe pack first); domain 17 pass.
- `bun run typecheck` 6/6, `bunx oxlint` clean, architecture and naming checks pass.
- Web export walked: empty Recipes, marketplace, recipe pack add (15) then Recipes grid with
  photos, Food links row, Grow, Programs.
