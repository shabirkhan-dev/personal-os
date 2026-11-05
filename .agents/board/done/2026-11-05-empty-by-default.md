---
id: pos-56
title: Nothing added by default across the app; suggestions only when picked
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: pos-55
depends_on: [pos-55]
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["packages/domain/src/{faith,finance}/model.ts", "apps/mobile/src/modules/{daily,faith,finance}/**"]
allowed_shared: []
created: 2026-11-05
updated: 2026-11-05
---

## What

The owner wants the app to start empty everywhere: the person adds their own plan by hand or
with AI, and templates or suggestions are there only if they pick one.

## Done

- Daily: no minimum day preselected; the drafted plan no longer adds career deep-work blocks.
- Faith: the tasbih sequence starts empty (Build my own / Use the classic); flashcards are not
  seeded (Add the starter deck); Grow shows the deck as optional.
- Finance: budget limits and the minimum list start empty. Budget offers Set my own or Use the
  suggested split; Runway offers the suggested minimum list. Setup no longer auto-splits.
- Training, Food, Fashion, Wishlist and Care were already opt-in (Care in pos-55).

## Validation

- mobile `bun test`: 334 pass, 0 fail; domain: 13 pass; API: 123 pass (local Postgres).
- `bun run typecheck` 6/6, `bunx oxlint` clean, oxfmt applied.
- Web export walked: tasbih, flashcards, budget, runway and minimum day all show their empty
  states with the opt-in suggestion.
