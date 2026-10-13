---
id: pos-3
title: One-command APK build and safer production profile
type: chore
from: pm
to: mobile
priority: normal
status: open
assignee: none
reviewer: human
parent: none
depends_on: []
branch: none
worktree: none
scope: ["apps/mobile/package.json", "apps/mobile/eas.json", "apps/mobile/README.md"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

Add `build:preview:android` (APK) and make it obvious which profile gives an APK vs a Play Store `.aab`.

## Why / Context

Builds started from the EAS dashboard default to the `production` profile and produce an `.aab` that cannot be installed directly.

## Proposal or Ask

Add the script; decide with the owner whether `production` builds an APK until the first Play Store release; document the dashboard steps (profile box, Android only) in the mobile README.

## Scope

**In scope:** `apps/mobile/package.json`, `apps/mobile/eas.json`, `apps/mobile/README.md`

**Out of scope:** anything not listed above; raise a card instead.

## Validation

- `bun --cwd=apps/mobile run lint`
- one `preview` build produces an APK

## Resolution

_Open._
