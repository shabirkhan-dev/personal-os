---
from: human
to: backend
priority: normal
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Expand backend domain and deployment test coverage

## Context

The unit suite currently passes 36 tests, while the HTTP e2e suite covers only
health, provider discovery, auth guards, not-found, and validation-envelope
behavior. The sole database integration test requires a manually available
PostgreSQL instance and fails at setup when it is absent.

Relevant code: `apps/nest-api/test/app.e2e-spec.ts`,
`test/auth.database.integration-spec.ts`, and the module specs.

## Requested outcome

Run integration tests against an isolated CI database or explicit test
container, and add route-level coverage for auth cookies/CSRF, sessions,
profiles/uploads, routines, finance, billing signatures/idempotency, and AI
upstream failures.

## Definition of done

- CI provisions/migrates a disposable database and fails clearly when it cannot.
- Critical success/error/authorization paths are covered through HTTP tests.
- Concurrency and provider-boundary tests cover the high-risk flows already
  identified on the board.

## Resolution

(open)
