---
from: human
to: backend
priority: high
status: done
assignee: backend
created: 2026-08-24
updated: 2026-08-24
---

# Handle bcrypt's password byte limit explicitly

## Context

The API accepts passwords up to 128 characters, while `AuthCryptoService` uses
`bcryptjs`, whose effective input limit is 72 bytes. Two different passwords
that share the first 72 bytes can therefore verify against the same hash; this
was reproduced locally with two 76-byte inputs.

Relevant code: `apps/nest-api/src/modules/auth/dto/auth.dto.ts` and
`apps/nest-api/src/modules/auth/auth-crypto.service.ts`.

## Requested outcome

Either migrate to a password hash with an appropriate input limit or enforce a
documented UTF-8 byte limit before hashing and verification. Apply the same
rule to register, reset, change-password, and login paths.

## Definition of done

- Password validation is byte-aware and consistent across every auth flow, or
  the replacement hash scheme is deployed safely.
- Tests prove distinct over-limit suffixes cannot authenticate interchangeably.
- The client-facing validation contract is updated if the accepted range changes.

## Resolution

Enforced a 72-byte UTF-8 limit on every password input (register, login, reset, change-password) via a Zod refine on `enteredPasswordSchema`/`passwordSchema` in `auth.dto.ts`. Over-limit passwords are rejected at validation, so distinct 72+ byte suffixes can no longer collide. Tests in `auth.dto.spec.ts` cover multi-byte over/under-limit inputs across all four flows.
