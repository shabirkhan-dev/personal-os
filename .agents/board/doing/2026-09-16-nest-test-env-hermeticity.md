---
id: pos-nest-test-env-hermeticity
title: Make nest-api tests independent of the developer shell environment
type: bug
from: reviewer
to: backend
priority: normal
status: open
assignee: none
reviewer: reviewer
parent: none
depends_on: []
branch: none
worktree: none
scope:
  - apps/nest-api/**
allowed_shared: []
created: 2026-09-16
updated: 2026-09-16
---

## What

`bun --cwd apps/nest-api run test` fails on a developer workstation, and passes in CI, because the
test suite reads configuration from `process.env` while vitest loads no `.env`. Make the suite
hermetic so a clean checkout and a configured workstation agree.

## Why / Context

Found while independently reviewing `2026-08-24-ai-control-plane-v0.md`, whose card claims
"`bun run test` — pass; nest-api 70 tests". It does not reproduce locally: **1 failed | 69 passed**.

```
FAIL src/modules/auth/auth.service.spec.ts > registers a user and persists only a hashed
     verification code
  expect(result.developmentCode).toBe('123456')
```

Root cause, confirmed by reproduction:

- `AuthService` only sets `developmentCode` when `config.exposeAuthCodes` is true
  (`apps/nest-api/src/modules/auth/auth.service.ts:505`), and `exposeAuthCodes` is
  `!this.isProduction && this.config.authDevExposeCodes`
  (`apps/nest-api/src/config/app-config.service.ts:93-95`).
- `auth.service.spec.ts:47` builds a **real** `new AppConfigService()`, so it reads live env.
- The schema default is `'true'` (`env.schema.ts:49-52`), and `apps/nest-api/.env` sets
  `AUTH_DEV_EXPOSE_CODES=true` — but vitest has no `dotenv`/`setupFiles`, so neither is read.
- The developer shell exports `AUTH_DEV_EXPOSE_CODES=false` (from the root `.env`), which wins.
- Proof: `env -u AUTH_DEV_EXPOSE_CODES bunx vitest run src/modules/auth/auth.service.spec.ts`
  → **3/3 pass**.

This is the same defect class as the ai-api `AI_SERVICE_TOKEN` bug fixed in `099a15e`, where
`os.environ.setdefault` in `conftest.py` silently no-op'd because the shell already exported the
variable. Two services, two languages, same failure mode: **tests whose result depends on the
developer's shell.**

The cost is not the single failing assertion. A suite that is red on every developer machine
destroys the signal the review and PM gates depend on — the same reason
`dependency-review` failing on every PR was flagged. It also means "tests pass" claims on cards
cannot be verified locally.

## Proposal or Ask

Pick one and record the decision:

- load a test-scoped env file in a vitest `setupFiles` entry, or
- construct the config from explicit values in unit specs instead of `new AppConfigService()`, or
- assert on resolved config rather than on a value whose presence depends on the environment.

Prefer whichever keeps production config loading unchanged. Explicitly reset any ambient variable
the suite depends on, mirroring the ai-api fix.

Also worth a pass for the same pattern: grep for other specs that build a real `AppConfigService`
or assert on env-derived flags.

## Definition of done

- `bun --cwd apps/nest-api run test` passes on a machine whose shell exports the root `.env`,
  without unsetting anything.
- The suite still passes with `AUTH_DEV_EXPOSE_CODES` unset and set to either value, or the
  dependency is removed.
- No change to production config resolution.

## Scope

**In scope:** `apps/nest-api/**`

**Out of scope:** ai-api test setup (already fixed in `099a15e`).

## Validation

- `bun --cwd apps/nest-api run test` on the developer machine, unmodified.
- `bun --cwd apps/nest-api run test` with `env -u AUTH_DEV_EXPOSE_CODES`.

## Resolution

Open. Raised by the reviewer during the `2026-08-24-ai-control-plane-v0.md` review; not yet
claimed. Not attributable to that card — it is pre-existing on `main`.
