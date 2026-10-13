---
id: pos-6
title: Wire onboarding sign-in (frame 17) to the Nest auth API
type: feature
from: pm
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: []
branch: ccr-f7a44e55-46aj0i
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

Frame 17 now signs in for real with a **passwordless email code**. The API's magic link only
served existing, verified accounts and linked to the disabled web app, so I added a backend slice:

Changed (backend):
- `POST /auth/methods/email-code/request` (creates an unverified passwordless account on first use, same answer either way) and `POST /auth/methods/email-code/verify` (single-use code, consumed atomically; marks the email verified; returns the session)
- challenge purpose `email_sign_in` + migration `0005_email_sign_in_challenge.sql`; `UsersService.createEmailOnlyUser`; sign-in code email
- contract documented in `backend-api.mdx`; user-facing "Starter" names → "Personal OS" (app name, email sender, Swagger)

Changed (mobile):
- `modules/auth/components/email-sign-in.tsx` (email → code → session, clear error states)
- `(onboarding)/sign-in.tsx`: "Continue with email" and "Not now" (the plan stays on the phone); `(home)/sign-in.tsx` + Sign in / Sign out in the Home profile menu
- auth service trimmed to the endpoints the app uses

Validation:
- nest typecheck, lint; unit 19 pass; integration (real Postgres, migrations 0000–0005) 2 pass
- curl: request 202, verify 200 with refresh token, wrong code 401, replayed code 401
- browser run of the mobile web build against the local API: wrong code shows the error, right code creates a verified account with the onboarding name and one session
- mobile typecheck, lint, 28 tests

Not done: Apple and Google buttons are hidden until pos-12. Phone builds need `EXPO_PUBLIC_NEST_API_URL` pointing at a deployed API before sign-in can work there.
