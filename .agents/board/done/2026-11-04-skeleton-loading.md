---
id: pos-44
title: Skeleton placeholders instead of page spinners and "Loading…" cards
type: feature
from: human
to: mobile
priority: normal
status: done
assignee: claude-code
reviewer: human
parent: pos-39
depends_on: []
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/src/components/ui/skeleton.tsx", "apps/mobile/src/modules/{wishlist,fashion,career,food}/**"]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

Screens that waited on their data showed a bare spinner or an empty card titled "Loading…"; they
now show card-shaped placeholders. Also fixes a Food Insights note that contradicted the screen.

## Why / Context

DESIGN.md asks for every state to be designed, loading included. Spinners and "Loading…" cards
made the layout jump when the real card arrived. Food Insights said "Nothing logged here yet"
next to "You need 120 g more protein today", counting the whole day's target as missing.

## Proposal or Ask

- `components/ui/skeleton.tsx`: `SkeletonCard` (optional photo block, text bars, a soft pulse that
  holds still with reduced motion, one screen-reader label) and `SkeletonList`.
- Used on Wishlist (home, dream, add, compare, roadmap, garage, insights), Fashion (piece, add)
  and Career (application, skill plan, flashcards). Spinners inside buttons stay.
- `foodNotes` suggests a dinner only once a meal is logged today.

## Scope

**In scope:** see `scope`.

## Validation

- Typecheck and oxlint clean; `bun --cwd=apps/mobile test`: 308 pass (1 new).
- Not seen rendered: local data loads too fast on web to catch the placeholder.

## Resolution

Landed on `ccr-cdb9b079-navb5d` in two commits.
