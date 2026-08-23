---
from: human
to: backend
priority: normal
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Make federated identity creation race-safe

## Context

Google sign-in creates the user and then inserts the Google identity in two
separate operations. Concurrent first logins can race on the unique identity or
email constraints, and an identity-insert failure can leave an orphaned
federated user. Google linking also performs a read-then-insert race.

Relevant code: `apps/nest-api/src/modules/social-auth/social-auth.service.ts`,
`social-auth.repository.ts`, and `users.repository.ts`.

## Requested outcome

Create or link the user and provider identity atomically, use database conflict
handling for concurrent requests, and reconcile an already-created identity
without leaving partial accounts.

## Definition of done

- Concurrent first Google logins converge on one user/identity.
- Link races return a stable conflict or success response, not a 500.
- Failed flows leave no orphaned user/profile records.
- Tests cover duplicate and cross-user identity races.

## Resolution

(open)
