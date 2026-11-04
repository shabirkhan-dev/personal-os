---
id: pos-42
title: Merge duplicates, one runway, To buy in Fashion, one flashcard review
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
scope: ["apps/mobile/src/modules/{career,finance,daily,fashion,faith}/**", "apps/mobile/src/components/flashcard-review.tsx"]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

Three overlaps from the UI/UX review: two runways, two "wishlists" and two flashcard screens.

## Why / Context

- Career and Finance each asked for cash on hand and monthly costs and could show different
  runways; the Daily brief rounded Career's to whole weeks.
- Fashion's "Wishlist" (clothes, tied to the wardrobe) shared a name with the Wishlist module
  (saving up for big things). Merging the data would lose features both ways and touch synced
  collections and the server's assistant tools, so they stay apart and get distinct names.
- Faith and Career flashcards were two copies of the same review screen.

## Proposal or Ask

- `FinanceSummary.runwayDays`; Career's `runwayWeeks` prefers it, its hero opens Finance's runway
  when that is set up, and the brief shows Finance's days. Career's own fields stay as the
  fallback for people without Finance.
- Fashion's list is "To buy" on screen; ids, routes and stored data are unchanged.
- `components/flashcard-review.tsx`: `useReview`, `ReviewProgress`, `CardStack`, `FlipHint`,
  `RatingRow`; each module keeps its own card face.

## Scope

**In scope:** see `scope`. **Out of scope:** server assistant wording, one Insights tab (next).

## Validation

- `bun --cwd=apps/mobile run typecheck`, `bunx oxlint`: clean. `bun --cwd=apps/mobile test`:
  304 pass (new runway test).

## Resolution

Landed on `ccr-cdb9b079-navb5d` in three commits (runway, To buy, flashcards).
