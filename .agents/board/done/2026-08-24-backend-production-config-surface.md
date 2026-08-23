---
from: human
to: backend
priority: normal
status: done
assignee: backend
created: 2026-08-24
updated: 2026-08-24
---

# Fail closed on production configuration and docs exposure

## Context

Production validation rejects the development JWT/token/AI values and missing
Resend credentials, but still permits localhost defaults for `WEB_APP_URL`,
`DATABASE_URL`, CORS, WebAuthn origin/RP ID, and email sender. Swagger is also
mounted unconditionally at `/api/docs`, including production.

Relevant code: `apps/nest-api/src/config/env.schema.ts` and
`apps/nest-api/src/app.setup.ts`.

## Requested outcome

Make critical production origins, database/TLS settings, sender, WebAuthn
values, and enabled-provider configuration explicit and reject development
defaults. Decide whether production OpenAPI is disabled, authenticated, or
served separately with a documented policy.

## Definition of done

- A production boot with localhost/default critical values fails with a clear
  configuration error.
- CORS, cookie, WebAuthn, email, database, and billing configuration are tested
  as a coherent deployment matrix.
- Production docs exposure is intentional and covered by an e2e/security test.

## Resolution

`env.schema.ts` production validation now rejects localhost/default
`DATABASE_URL`, `CORS_ORIGIN`, `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN`, and the
development email sender, and requires `DATABASE_SSL=true` (unless a managed
host URL). Swagger is gated on `SWAGGER_ENABLED`, defaulting to **off** in
production (fail-closed). Tests: `env.schema.spec.ts` covers the accept + reject
matrix. Policy documented on the status board.
