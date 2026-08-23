---
from: human
to: backend
priority: high
status: done
assignee: backend
created: 2026-08-24
updated: 2026-08-24
---

# Require step-up auth for security-factor changes

## Context

`AuthSecurityController` protects TOTP setup/disable, passkey registration and
deletion, and Google linking with only `JwtAuthGuard`. A stolen short-lived
access token can therefore add an attacker-controlled factor, remove a factor,
or link an identity without a current-password or recent-authentication check.

Relevant code: `apps/nest-api/src/modules/auth/auth-security.controller.ts` and
the MFA, passkey, and social-auth services.

## Requested outcome

Add a short-lived, single-use step-up flow bound to the user, session, and
requested security action. Require it for factor enrollment/removal and social
identity changes, and decide whether existing sessions should be revoked or
users notified after a security-factor mutation.

## Definition of done

- A bearer token alone cannot change account recovery/authentication factors.
- Step-up challenges expire, cannot be replayed, and are concurrency-safe.
- Tests cover each factor mutation and session/user mismatch cases.
- Any new request/response contract is documented in
  `apps/docs/content/docs/backend-api.mdx`.

## Resolution

Added a single-use step-up flow: `POST /auth/security/step-up` (current password) issues a short-lived token bound to user + session + action, stored as a `step_up` challenge (new enum value + `action`/`session_id` columns). `StepUpGuard` consumes it atomically and guards TOTP setup/confirm/disable, passkey register/delete, and Google link. Tests in `step-up.guard.spec.ts` cover action/session mismatch, expiry, and concurrent consumption.
