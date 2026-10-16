---
id: pos-30
title: Training (was Workout) from the Figma Training section
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude
reviewer: human
parent: none
depends_on: [pos-29]
branch: agent/mobile/training-module
worktree: none
scope: ["apps/mobile/src/modules/workout/**", "apps/mobile/src/app/(home)/training/**", "apps/mobile/assets/training/**", "apps/mobile/src/modules/home/**", "apps/mobile/src/modules/daily/components/daily-home-view.tsx", "apps/mobile/src/modules/onboarding/lib/options.ts", "apps/api/src/modules/ai/**", "apps/api/test/**", "apps/docs/content/docs/**"]
allowed_shared: []
created: 2026-10-16
updated: 2026-10-16
---

## What

Workout becomes Training, from the Figma Training section (376:409):

- Home: "3 of 5 sessions" hero, ask bar with Start / Log it / Timer, today's session card, the
  week's dots, activity today, recent sessions, personal bests and the phase.
- Empty state: pick sports (photos) and days a week, Build my first week.
- Session plan, live session (sets, number to beat, rest ring, next), boxing rounds (work/rest
  ring, call-outs read aloud, focus per round), session summary (run pace and splits, sets,
  effort, note), skills, this week (edit, rebalance) and Insights.

## Proposal or Ask

- The week takes turns by sport across the days picked; free days get mobility or rest.
  Rebalance moves a missed session to the next easy day.
- Live sessions are kept in a local file so they survive closing the app; finished sessions go to
  the record store and sync. The old "workout" file's sessions move over once.
- `POST /ai/training/ask` and `POST /ai/training/skill` (a step ladder for a new skill).
- The module id stays `workout`; Daily life reads the same `useWorkoutDay()`.

## Validation

- Lint, format and typecheck: clean.
- Mobile tests: 226 pass, including 10 for Training (old Workout tests removed with their code).
- API tests: 62 pass.
- `expo export --platform android`: bundles.
