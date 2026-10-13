---
id: pos-9
title: Make mobile auth bootstrap errors explicit
type: bug
from: pm
to: mobile
priority: low
status: open
assignee: none
reviewer: human
parent: none
depends_on: [pos-6]
branch: none
worktree: none
scope: ["apps/mobile/src/modules/auth/context/auth-context.tsx"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

`AuthProvider` swallows refresh and profile errors (`catch {}` / `.catch(() => clearSession())`) on every launch.

## Why / Context

The contract forbids silent catches; on devices without an API every launch fails quietly, which will hide real auth bugs once sign-in is wired.

## Proposal or Ask

Distinguish no-session, offline and server errors; log in dev; surface a retry where it matters. Best done with pos-6.

## Scope

**In scope:** `apps/mobile/src/modules/auth/context/auth-context.tsx`

**Out of scope:** anything not listed above; raise a card instead.

## Validation

- mobile lint, typecheck, test

## Resolution

_Open._
