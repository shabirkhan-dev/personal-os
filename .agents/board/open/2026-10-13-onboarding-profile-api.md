---
id: pos-7
title: Store the onboarding answers and plan on the API
type: feature
from: pm
to: backend
priority: normal
status: open
assignee: none
reviewer: human
parent: none
depends_on: [pos-6]
branch: none
worktree: none
scope: ["apps/nest-api/src/modules/profiles/**", "apps/docs/content/docs/backend-api.mdx"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

An endpoint to save and read the onboarding answers (about you, goals, modules, reminders) and the derived plan for the signed-in user.

## Why / Context

Onboarding state only lives on the device (Zustand + SecureStore); it is lost on reinstall and invisible to the AI service.

## Proposal or Ask

Extend `profiles` (or add a module) with a validated schema and migration; document it in `backend-api.mdx`. A follow-up mobile card syncs the store after sign-in (depends on pos-6).

## Scope

**In scope:** `apps/nest-api/src/modules/profiles/**`, `apps/docs/content/docs/backend-api.mdx`

**Out of scope:** anything not listed above; raise a card instead.

## Validation

- nest lint, typecheck, test (unit + e2e)
- contract documented in `backend-api.mdx`

## Resolution

_Open._
