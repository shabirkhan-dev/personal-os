---
from: human
to: backend
priority: high
status: done
assignee: backend
created: 2026-08-24
updated: 2026-08-24
---

# Make login lockout counters atomic

## Context

`UsersService.recordFailedLogin` calculates the next counter from the user row
read before password verification, then writes an absolute value. Concurrent
failed logins can overwrite one another and avoid the configured lockout; a
successful login can also race with a stale failed-login write.

Relevant code: `apps/nest-api/src/modules/auth/auth.service.ts`,
`apps/nest-api/src/modules/users/users.service.ts`, and
`apps/nest-api/src/modules/users/users.repository.ts`.

## Requested outcome

Move failed-attempt increment, lock calculation, and successful-login reset to
conditional database operations or a transaction that cannot lose updates.
Preserve generic credential errors and the existing lockout response.

## Definition of done

- Parallel wrong-password requests cannot bypass `MAX_LOGIN_ATTEMPTS`.
- A successful login cannot be overwritten by an older failed attempt.
- Tests cover concurrent failures, lock expiry, and reset-vs-failure races.

## Resolution

`UsersRepository.incrementFailedLogin` now uses a SQL `+ 1` increment inside a transaction and conditionally locks (`locked_until IS NULL`) once the threshold is crossed, so concurrent failures cannot be lost. `recordFailedLogin` now takes a userId instead of a stale user row. Concurrency-specific integration coverage is tracked under domain-e2e-coverage.
