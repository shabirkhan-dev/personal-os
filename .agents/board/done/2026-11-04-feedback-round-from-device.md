---
id: pos-49
title: Owner's device feedback, no rings, one settings, one module switcher, new Overview
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: pos-48
depends_on: []
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/**", "apps/api/src/modules/static/**", "apps/api/src/app.ts", "apps/api/test/**", "packages/tokens/src/**", "packages/domain/src/assistant/index.ts", "scripts/upload-app-photos.sh", "DESIGN.md"]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

Feedback from the owner after installing the 0.1.0 APK, with screenshots: outline rings everywhere,
units in two places, no way to change height or weight after onboarding, three ways to switch
modules, the tab bar's active highlight gone, Overview, a second font, uneven spacing, labels in
the app's own voice, and built-in photos making the APK bigger.

## Proposal or Ask

- Every `borderWidth` removed; selected, today and focused states use a tint.
- Tab bar is Today, Insights, Profile, with a tinted active tab; the header grid button is the one
  module switcher and the module pill opens the module's own screens (`module-sections.ts`).
- Settings screen: height, weight, birthday, gender, units, theme, currency, week start. Edit
  profile is photo and name.
- Overview: greeting, ask bar, Up next, three tiles, Today timeline, calendar.
- One font (system, tabular figures); Amiri Quran only for Arabic. One spacing scale.
- First-person copy rewritten.
- Built-in photos move to `apps/mobile/app-photos`, uploaded by `scripts/upload-app-photos.sh` to
  R2 `static/` and served by `GET /api/v1/static/*`; the app fetches them once into the image cache.

## Validation

- Typecheck and oxlint clean; mobile 316 tests pass; the API static route's 3 tests pass (run
  without Postgres; the rest of the API suite needs it and runs in CI).
- Web export screenshots: Overview, the pill menu, Training week, Settings and its sheets, Edit
  profile.

## Resolution

Landed on `ccr-cdb9b079-navb5d`. Needs the owner to run `bash scripts/upload-app-photos.sh` once
(and the API deployed) before built-in photos show.
