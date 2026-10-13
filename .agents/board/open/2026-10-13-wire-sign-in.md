---
id: pos-6
title: Wire onboarding sign-in (frame 17) to the Nest auth API
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
scope: ["apps/mobile/src/app/(onboarding)/sign-in.tsx", "apps/mobile/src/modules/auth/**"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

Apple, Google and email buttons on frame 17 call the real auth flow instead of skipping to the next screen.

## Why / Context

`sign-in.tsx` notes that account creation is not wired yet. The Nest API already has auth, social-auth and magic-link modules, and the mobile `AuthProvider` exists.

## Proposal or Ask

Start with email magic link (already in the API), then Google and Apple via `social-auth`. Keep a clear error state when the API is unreachable. Read `backend-api.mdx` first; raise a backend card for gaps.

## Scope

**In scope:** `apps/mobile/src/app/(onboarding)/sign-in.tsx`, `apps/mobile/src/modules/auth/**`

**Out of scope:** anything not listed above; raise a card instead.

## Validation

- mobile lint, typecheck, test
- sign-in works against a local Nest API on a device

## Resolution

_Open._
