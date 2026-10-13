---
id: pos-7
title: Store the onboarding answers and plan on the API
type: feature
from: pm
to: backend
priority: normal
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: [pos-6]
branch: ccr-f7a44e55-46aj0i
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

The answers now live on the API and sync both ways. The plan is not stored; it is derived from the
answers on the device.

Changed (backend):
- `onboarding` module: `GET`/`PUT /users/me/onboarding` (bearer), strict zod schema that mirrors the mobile store, `onboarding_profiles` table (jsonb + schema version), migration `0006`
- a stored row that no longer matches the schema reads as `null` (logged) instead of a 500
- contract in `backend-api.mdx`

Changed (mobile, shared with pos-6's auth):
- `onboarding.service.ts`, `lib/sync.ts` (newer side wins, tested), `use-onboarding-sync.ts` mounted in the Home layout: reconcile once per session, then upload changes about 1 s after they happen; the device remembers when its answers last changed
- `apiClient.put`

Validation:
- nest typecheck, lint, 23 unit tests (4 new); migration applied to Postgres
- curl: GET before save → null, PUT → 200, GET after → saved, bad body → 400, no token → 401
- browser run against the local API: after signing in, the server row held the device's answers
- mobile typecheck, lint, 31 tests
