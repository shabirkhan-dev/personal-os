---
id: pos-43
title: One Insights tab, a module switcher on every Insights screen
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
scope:
  [
    "apps/mobile/src/components/module-screen.tsx",
    "apps/mobile/src/modules/home/**",
    "apps/mobile/src/modules/profile/components/profile-screen.tsx",
    "apps/mobile/src/app/(home)/index.tsx",
  ]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

Eight separate Insights screens become one Insights tab: a row of the person's modules sits above
each module's Insights and switches between them, and the tab works from every screen.

## Why / Context

Each Insights was reachable only from its own module, and the tab was disabled on Profile, Career,
Calendar and the Assistant.

## Proposal or Ask

- `InsightsSwitcher` in `ModuleScreen` when `insights.active`: chips for the person's modules that
  have Insights; switching uses `replace`, so Back still leaves Insights.
- `insightsTabPress()`: from a screen without its own Insights, the last one opened (while that
  module is still on), else the first.
- Route list and choice logic in `modules/home/lib/insights-routes.ts`, with tests.

## Scope

**In scope:** see `scope`. The module Insights screens themselves are unchanged.

## Validation

- Typecheck and oxlint clean; `bun --cwd=apps/mobile test`: 307 pass (3 new).
- Web export in Playwright: Overview → Insights opens Daily life; chips switch to Finance and
  Food; Profile → Insights returns to Food.

## Resolution

Landed on `ccr-cdb9b079-navb5d`. Follow-ups seen: Food Insights shows a protein "dinner idea"
with nothing logged; the Ask button on inner screens can cover the last card.
