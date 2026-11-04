---
id: pos-45
title: Career Insights
type: feature
from: human
to: mobile
priority: normal
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: [pos-43]
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/src/modules/career/**", "apps/mobile/src/modules/home/lib/insights-routes*", "apps/mobile/src/app/(home)/career/insights.tsx"]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

Career was the only module without Insights.

## Proposal or Ask

`career-insights.ts` (recap and notes, pure) and `CareerInsightsScreen`: sent, replies and skill
minutes for this week, last week or the month; notes for an interview within three days without
prep, follow-ups due, a slow week (from Wednesday) and no replies after eight applications in 30
days. Joins the Insights switcher and Career Home's tab.

## Validation

- Typecheck and oxlint clean; 4 new tests in `career-insights.test.ts`; route tests updated.

## Resolution

Landed on `ccr-cdb9b079-navb5d` (`feat(career): insights…`).
