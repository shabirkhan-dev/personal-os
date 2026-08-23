---
from: human
to: backend
priority: high
status: done
assignee: backend
created: 2026-08-24
updated: 2026-08-24
---

# Make one-time auth challenge consumption atomic

## Context

`AuthService` validates an email-verification or password-reset challenge before
`AuthRepository.completeEmailVerification` / `completePasswordReset` marks it
consumed. Those are separate operations, so two concurrent requests with the
same valid code can both pass validation before either request records
`consumedAt`. Challenge-attempt counters also use a read-then-write flow.

Relevant code: `apps/nest-api/src/modules/auth/auth.service.ts` and
`apps/nest-api/src/modules/auth/auth.repository.ts`.

## Requested outcome

Consume a challenge with an atomic conditional update (and keep the user
mutation in the same transaction where appropriate). Make attempt increments
safe under concurrency and preserve the existing error envelope.

## Definition of done

- A challenge can be accepted at most once, even under concurrent requests.
- Failed-attempt limits cannot be bypassed by concurrent requests.
- Repository/service tests cover concurrent verification and reset attempts.
- The auth API contract remains accurate in `apps/docs/content/docs/backend-api.mdx`.

## Resolution

Challenge attempts are atomically incremented (SQL `+ 1`) and auto-consume at threshold. `completeEmailVerification` and `completePasswordReset` now condition on `consumed_at IS NULL` and return a boolean; the service throws the standard OTP error when a concurrent request already consumed the challenge.
