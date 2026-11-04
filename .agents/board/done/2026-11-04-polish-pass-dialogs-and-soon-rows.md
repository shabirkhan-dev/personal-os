---
id: pos-41
title: Polish pass, Kit v2 dialogs, a compact budget prompt and no "Soon" rows
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: pos-39
depends_on: []
branch: ccr-cdb9b079-navb5d
worktree: none
scope:
  [
    "apps/mobile/src/components/ui/**",
    "apps/mobile/src/app/_layout.tsx",
    "apps/mobile/src/app/(home)/index.tsx",
    "apps/mobile/src/modules/**",
  ]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

A polish pass found by walking the web export: system alerts, an empty money card, a cut-off
Finance hero, a floating Ask button over content, and Profile rows for things that don't exist.

## Why / Context

- `Alert.alert` (27 calls in 17 files) ignores the theme and does nothing on web.
- Every module Home has its own ask bar, so the floating Ask button kept by pos-39 on five Homes
  duplicated it and covered cards.
- Home's money card was a 240px empty pocket saying "Not set"; Finance's hero read "How long can
  you l…".
- Profile listed Pinned order, the desktop app, Health Connect, Calendar and Smartwatch as "Soon".

## Proposal or Ask

`showDialog` (same arguments as `Alert.alert`) drawn by a `DialogHost` at the root and inside each
`Sheet`; a `danger` PillButton variant for destructive choices; the floating Ask button off every
Home; a one-row "Set a monthly budget" prompt; "Runway not set" as the Finance hero; the "Soon"
rows and their dead helpers removed.

## Scope

**In scope:** see `scope`. **Out of scope:** skeleton loaders, merging duplicate features.

## Validation

- `bun --cwd=apps/mobile run typecheck` and `bunx oxlint`: clean. `bun --cwd=apps/mobile test`:
  303 pass.
- Web export walked in Playwright at 390×844, dark: Home, Finance, Training, Profile and the
  Replay onboarding dialog.
- Not checked on a device: the dialog inside a sheet on iOS needs a look.

## Resolution

New `components/ui/dialog.tsx`; every `Alert.alert` now calls `showDialog`.
