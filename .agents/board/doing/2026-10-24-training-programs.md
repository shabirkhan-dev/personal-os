---
id: pos-34
title: training programs with progression, a bigger exercise library and a program builder
type: feature
from: human
to: mobile
priority: high
status: doing
assignee: mobile (claude code)
reviewer: human
parent: none
depends_on: [2026-10-24-ai-program-design.md]
branch: agent/mobile/training-programs
worktree: main checkout (light mode)
scope: [apps/mobile/src/modules/workout, apps/mobile/src/app/(home)/training, apps/mobile/assets/training/demos]
allowed_shared: []
created: 2026-10-24
updated: 2026-10-24
---

## What

Programs for Training: a goal over weeks, sessions that progress, built around team days, session
length and equipment. Twelve built-in programs, programs people design by hand or with AI, an
exercise library of about 85 exercises with 45 photo demos, and video links.

## Why / Context

Training today repeats nine fixed sessions with fixed sets and reps. The owner asked for
programs, progression, demos and a way to design their own (`/docs/production-roadmap`).

## Proposal or Ask

- Catalog (`lib/exercise-guide.ts`), chains and programs (`lib/programs/`), a pure engine for weeks,
  sessions and double progression, with deload and test weeks.
- Collections `training-programs` and `training-progress` (sync accepts any collection name; the
  docs list is updated by pos-35).
- Screens: programs, program detail with a start sheet, builder (manual and AI), exercise library;
  Training Home shows the active program.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** the API task (pos-35), other modules.

## Validation

- `bun --cwd=apps/mobile run lint`, `typecheck`, `test` (engine tests cover every built-in program)
- Preview build and device check

## Resolution
