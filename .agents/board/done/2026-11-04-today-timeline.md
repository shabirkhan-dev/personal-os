---
id: pos-46
title: One Today timeline on Overview
type: feature
from: human
to: mobile
priority: normal
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: []
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/src/modules/daily/**"]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

Overview showed a grid of module tiles and a "Rest of today" list. They are now one Today card.

## Proposal or Ask

`timeline.ts` merges the plan's blocks (prayers, meals, care, training, career) with today's
bills and personal events from the calendar (interviews and training already come through the
plan), all-day rows first. `splitAtNow` puts ended or done rows above a Now line; earlier rows
fold after two. Calendar rows open the calendar. `ModuleTiles` is removed.

## Validation

- 2 new tests in `timeline.test.ts`; web export screenshot of Overview.

## Resolution

Landed on `ccr-cdb9b079-navb5d` (`feat(daily): one today timeline…`).
