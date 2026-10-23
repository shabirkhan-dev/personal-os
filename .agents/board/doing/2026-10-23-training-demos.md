---
id: pos-33
title: exercise demos and live session fixes for training
type: feature
from: human
to: mobile
priority: normal
status: doing
assignee: mobile (claude code)
reviewer: human
parent: none
depends_on: []
branch: agent/mobile/training-demos
worktree: main checkout (light mode)
scope: [apps/mobile/src/modules/workout, apps/mobile/assets/training/demos]
allowed_shared: []
created: 2026-10-23
updated: 2026-10-23
---

## What

Training shows one stock photo for many exercises (Plank shows push-ups, Hollow hold shows yoga),
and the live screen has a fake "play" badge over a still photo. The live session also lacks a pause,
logs timed blocks (5 min warm-up, runs) as reps, has no timer for holds, gives no rest-over alert
when the phone is locked, and the session summary shows hold values without units.

## Why / Context

- `workout/lib/library.ts`, `components/live-screen.tsx`, `components/plan-screen.tsx`,
  `components/session-screen.tsx`.
- Demo photos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db), The Unlicense
  (public domain). Only exercises whose photos match the movement are mapped.

## Proposal or Ask

1. Bundle start/end frames for matching exercises; an animated demo (cross-fade, still under
   reduced motion) on the live screen and a how-to sheet (demo + short cues) from the plan and live
   screens. Others keep their photo.
2. Live screen: pause/resume, a countdown for holds and timed blocks, timed blocks are not logged
   as reps, a local notification when rest ends while the app is in the background, "Skip exercise".
3. Session summary shows "s" on held sets.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** new exercises or templates, API changes, other modules.

## Validation

- `bun --cwd=apps/mobile run lint`, `typecheck`, `test`
- Unit tests for the cue mapping and the timer maths
- Device check on a preview build

## Resolution
