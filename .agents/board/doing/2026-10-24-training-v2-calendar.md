---
id: pos-36
title: training v2 (activities, own exercises, media, smart tracking) and an app-wide calendar
type: feature
from: human
to: mobile
priority: high
status: doing
assignee: mobile (claude code)
reviewer: human
parent: 2026-10-24-training-programs.md
depends_on: [2026-10-24-media-uploads.md]
branch: agent/mobile/training-programs
worktree: main checkout (light mode)
scope: [apps/mobile/src/modules/workout, apps/mobile/src/modules/calendar, apps/mobile/src/app/(home), apps/mobile/src/modules/users/services, apps/mobile/package.json]
allowed_shared: [bun.lock]
created: 2026-10-24
updated: 2026-10-24
---

## What

Owner feedback on the programs build: hard-coded sports and phases, half-width banners, a ring on
the active program, poor demos, no way to add own exercises or sports, AI not reachable, and no
calendar. Asked for all four phases in one go.

## Proposal or Ask

1. Fixes: full-width photos, no accent ring, phase cards removed, Training Home redesigned.
2. Activities people define (name, category, what to track); team days use them.
3. Own exercises and overrides of built-ins, with media: images and animations on R2 (pos-37),
   videos as Google Drive links played in Drive's player. Adds `expo-image` (animated GIF/WebP)
   and `react-native-webview` (Drive player).
4. A calendar module every module feeds: training (program weeks ahead, phases, sessions),
   career (interviews, follow-ups), finance (bills), and personal events.
5. Smart tracking: per-exercise history, bests, estimated 1RM, weekly volume, adherence,
   activity totals, readiness, AI weekly review.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** Health Connect / Apple Health import (native module, separate card).

## Validation

- `bun --cwd=apps/mobile run lint`, `typecheck`, `test`; web preview of every new screen; preview build

## Resolution
