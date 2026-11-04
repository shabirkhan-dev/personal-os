---
id: pos-39
title: One ask surface per screen and Areas that behaves the same everywhere
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: []
branch: ccr-cdb9b079-navb5d
worktree: none
scope:
  [
    "apps/mobile/src/app/(home)/index.tsx",
    "apps/mobile/src/components/module-screen.tsx",
    "apps/mobile/src/modules/home/store/**",
    "apps/mobile/src/modules/daily/components/daily-overview.tsx",
    "apps/mobile/src/modules/profile/components/profile-screen.tsx",
  ]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

First pass of the UI/UX refinement: fewer competing ways to reach the assistant, and navigation
controls that mean the same thing on every screen.

## Why / Context

Overview showed the ask bar, "Ask AI" and "Talk to OS" chips, a "Log" pill to Talk to OS and the
floating Ask button, all for the same job. Finance, Food and Faith homes had an ask bar and the
floating Ask button. The Areas tab and the header pill on inner screens went back to Home instead
of opening the module switcher, and Profile was reached with `replace` from Home but `push` from
module screens, so its Today tab stacked a second Home.

## Proposal or Ask

- The ask bar is the one ask surface where it exists (it types, speaks, logs and asks); the
  floating Ask button stays only on Homes without one and on inner screens.
- Talk to OS (`/listen`) stays as the hands-free target for "Hey OS" and links, with no buttons.
- Areas (tab and header pill) opens the module switcher from any screen; Profile is pushed and
  its Today tab dismisses back to Home.

## Scope

**In scope:** see `scope`.

**Out of scope:** onboarding length, polish pass, merging duplicate features (next cards).

## Validation

- `bun --cwd=apps/mobile run typecheck`: clean.
- `bun --cwd=apps/mobile test`: 303 pass, 0 fail.
- `bun run lint`: oxlint 0 warnings, 0 errors in every workspace; ShellCheck is not installed in
  this container (no shell files changed).
- `bun run architecture:check`: passed.
- Not checked on a device or `preview:web`.

## Resolution

Landed on `ccr-cdb9b079-navb5d`. New `modules/home/store/areas-picker.ts` holds the picker's
open state so any screen can open it via `openAreas()`.
