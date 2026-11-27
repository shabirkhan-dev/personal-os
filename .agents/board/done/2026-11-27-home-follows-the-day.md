---
id: pos-65
title: Home follows the day - moment card, card order and ask suggestions by time of day
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: pos-58
depends_on: [pos-62]
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/src/modules/home/**", "apps/mobile/src/app/(home)/index.tsx", "apps/docs/content/docs/production-roadmap.mdx"]
allowed_shared: []
created: 2026-11-27
updated: 2026-11-27
---

## Done

- `momentAt(minute, wake, bed)`: morning, day, evening or night from the person's own wake and
  bed times (late risers and after-midnight bedtimes included).
- Overview leads with a moment card (two by two, each with its module's live line): morning
  brief, prayer, morning routine, what to wear; night: close the day, night routine, Isha,
  tomorrow's outfit. Card order and the ask bar's suggestions follow the moment.

## Validation

- day-moment tests (ordinary day, late riser, night owl, module filter); mobile 375 pass;
  typecheck and oxlint clean.
- Web export with the clock at 07:20, 13:00, 18:30 and 22:15: four different Homes.
