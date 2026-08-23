---
from: human
to: backend
priority: high
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Separate liveness from dependency readiness

## Context

`GET /health` always returns `{ status: "ok" }` from configuration only. The
container healthcheck uses that endpoint, so an API with a dead PostgreSQL
connection—or migrations not applied—can be marked healthy and receive traffic.

Relevant code: `apps/nest-api/src/modules/health/health.service.ts`,
`health.controller.ts`, and `apps/nest-api/Dockerfile`.

## Requested outcome

Provide lightweight liveness and dependency-aware readiness checks. Check the
database (and any required startup dependency) with bounded timeouts, keep
diagnostic detail out of public responses, and point orchestration healthchecks
at the right endpoint.

## Definition of done

- Liveness remains available during dependency failure.
- Readiness fails when the database/schema is unavailable.
- Docker/deployment checks and API documentation describe the distinction.
- Tests cover healthy, timeout, and dependency-failure states.

## Resolution

(open)
