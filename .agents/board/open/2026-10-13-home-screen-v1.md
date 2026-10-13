---
id: pos-5
title: Home screen v1 from the Figma Kit v2 file
type: feature
from: pm
to: mobile
priority: high
status: open
assignee: none
reviewer: human
parent: none
depends_on: []
branch: none
worktree: none
scope: ["apps/mobile/src/app/(home)/**", "apps/mobile/src/modules/home/**"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

Replace the placeholder home with the real home screen designed in Figma Kit v2, built from the user's onboarding plan.

## Why / Context

After onboarding the app shows only a greeting and a Replay button.

## Proposal or Ask

Owner points to the Figma home frames (file `3KjKY0nbjCHqKZb0xRhWIh`). Build with tokens and Kit v2 components; read data from the onboarding store until the API exists. Done when it matches the frames in Dark and Light.

## Scope

**In scope:** `apps/mobile/src/app/(home)/**`, `apps/mobile/src/modules/home/**`

**Out of scope:** anything not listed above; raise a card instead.

## Validation

- mobile lint, typecheck, test
- screenshots in Dark and Light vs Figma

## Resolution

_Open._
