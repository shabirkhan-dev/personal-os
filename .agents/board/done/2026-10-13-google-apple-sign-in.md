---
id: pos-12
title: Google and Apple sign-in on mobile
type: feature
from: mobile
to: mobile
priority: normal
status: open
assignee: none
reviewer: human
parent: pos-6
depends_on: []
branch: none
worktree: none
scope: ["apps/mobile/**", "apps/nest-api/src/modules/social-auth/**", "apps/docs/content/docs/backend-api.mdx"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

Add "Continue with Google" and "Continue with Apple" to frame 17, as in the Figma design.

## Why / Context

pos-6 shipped email-code sign-in. The API verifies Google ID tokens for one client ID only and
has no Apple support; the app has no native Google or Apple sign-in.

## Proposal or Ask

- Owner: create Google OAuth client IDs (iOS, Android, web) and enable Sign in with Apple on the
  Apple developer account.
- Backend: accept several Google audiences; add Apple identity-token verification.
- Mobile: native Google sign-in and `expo-apple-authentication`; show each button only when its
  provider is configured (`GET /auth/methods`). Needs a new EAS build.

## Scope

**In scope:** see `scope`.

**Out of scope:** web sign-in.

## Validation

- nest and mobile checks; sign-in on a real iPhone and Android device

## Resolution

_Open._
