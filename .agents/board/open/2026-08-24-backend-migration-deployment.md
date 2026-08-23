---
from: human
to: backend
priority: normal
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Make migration execution safe for rolling deployments

## Context

The Docker entrypoint runs database migrations in every application container
before starting the server. Multiple replicas can race during deploys, and the
standalone `src/database/migrate.ts` reads only `DATABASE_URL`, so its TLS
behavior can differ from `DatabaseService` when `DATABASE_SSL=true` is used.

Relevant code: `apps/nest-api/docker-entrypoint.sh`,
`apps/nest-api/src/database/migrate.ts`, and `database.service.ts`.

## Requested outcome

Use a single migration job/release step or an explicitly locked migration
runner, make migration connection settings match the application, and define
the rollout/readiness behavior while migrations are pending or fail.

## Definition of done

- Concurrent deploys cannot apply the same migration unsafely.
- TLS, pool, and connection settings are consistent for migrate and runtime.
- Deployment tests/documentation cover migration failure and rollback handling.

## Resolution

(open)
