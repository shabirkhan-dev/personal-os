---
id: pos-nest-test-env-hermeticity
title: Make nest-api tests independent of the developer shell environment
type: bug
from: reviewer
to: backend
priority: normal
status: doing
assignee: backend
reviewer: reviewer
parent: none
depends_on: []
branch: agent/backend/nest-test-env-hermeticity
worktree: ../personal-os-worktrees/agent/backend/nest-test-env-hermeticity
scope:
  - apps/nest-api/**
allowed_shared: []
ports: none (targeted test runs only)
created: 2026-09-16
updated: 2026-09-17
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

Implementation complete on `agent/backend/nest-test-env-hermeticity` (tip `1296828`).
**PR #19 open; awaiting independent review.** Not closed yet — the review state is pending.

### Changed

- `apps/nest-api/test/setup-unit-env.ts` (new) — vitest setup that assigns `NODE_ENV`,
  `AUTH_DEV_EXPOSE_CODES`, `AUTH_TOKEN_SECRET`, and `JWT_SECRET` **outright**, so an ambient value
  cannot win.
- `apps/nest-api/vitest.config.ts` — registers that file via `setupFiles`.

### Decision recorded

Pinned at the harness rather than giving each spec an explicit config. `AuthService` alone reads
**eleven** config getters (`exposeAuthCodes`, the TTLs, `maxLoginAttempts`, `webAppUrl`, ...), so a
hand-rolled stub would be large and easy to get subtly wrong, and `AppConfigService` hardcodes
`createAppConfig()` with no injection seam to pass one through. Adding a constructor seam is a
change to a production class for test convenience and deserves its own card if wanted.

`NODE_ENV` is pinned to `test` so a shell exporting `production` cannot trip the production
`superRefine` guards and throw at config construction; the two secrets are pinned so a malformed
ambient value cannot. Only one of the four variables is what broke the suite.

### Validation

- `bun --cwd apps/nest-api run test`, unmodified shell (`AUTH_DEV_EXPOSE_CODES=false`):
  15 files, **70 passed** (was 1 failed | 69 passed)
- `env -u AUTH_DEV_EXPOSE_CODES bun --cwd apps/nest-api run test`: 15 files, **70 passed**
- `AUTH_DEV_EXPOSE_CODES=true bun --cwd apps/nest-api run test`: 15 files, **70 passed**
- `bun --cwd apps/nest-api run lint`: Biome clean (133 files)
- `bun --cwd apps/nest-api run typecheck`: 0 errors
- root `bun run typecheck` (turbo): 5/5 tasks successful
- `bun run architecture:check`: boundaries pass, naming OK (753 paths)

### Contract impact

None. Production config resolution is unchanged — `parseEnv()`/`createAppConfig()` and the
`dotenv/config` imports in `main.ts` and `migrate.ts` are untouched. Only the unit-suite process is
pinned. No `backend-api.mdx` change.

### Audit this card asked for

- `new AppConfigService()` appears in **4** files: three unit specs (`auth.service.spec.ts`,
  `auth-crypto.service.spec.ts`, `mfa.service.spec.ts`), all covered by the new setup file, plus
  `test/auth.database.integration-spec.ts`, which uses a separate vitest config and imports
  `dotenv/config` for a real database. `dotenv` does not override an existing variable, so it has
  the same theoretical exposure, but it asserts nothing env-derived and needs Postgres — left
  unchanged and flagged here for whoever hardens the integration suite.
- `developmentCode` / `exposeAuthCodes` / `isProduction` / `swaggerEnabled` / `nodeEnv` are
  asserted in **exactly one** place: `auth.service.spec.ts:91`, the assertion that was failing.
  No other spec asserts on an env-derived flag.
- No spec reads `process.env` directly.

### Review

- **No independent review was recorded.** PR #19 has zero reviews, zero inline comments, and
  zero issue comments; no `.agents/notes/` file records a verdict. The card's declared
  `reviewer` never signed off.
- **Merged by the human product owner** on 2026-09-17 as `f7676a6`, once CI was green. That
  approval stands on its own authority (`roles/pm.md` names the human as final approver), but it
  is recorded here as an owner merge, **not** as a completed independent review, so the two are not
  confused later.
- The implementation role and the role recording this are the same, and `agent-contract.md` bars
  self-approval. An independent verdict against the merged commit would need a different session.
- CI on the merged revision: `lint`, `typecheck`, `test` (4m10s), `e2e-web`, `codeql`, and
  `CodeQL` all pass. `dependency-review` fails — pre-existing on every PR since July, tracked at
  the repo-settings level, not attributable to this change.

### Known limitations (disclosed, not blocking)

- The suite still **reads** `process.env`; it is pinned, not decoupled. The DoD's "or the
  dependency is removed" option was not taken.
- The pinned harness makes the `exposeAuthCodes === false` branch unreachable in unit tests. No
  test covered that branch before or after, so nothing was lost, but a future one must override
  the config explicitly.
- The new setup file is **not typechecked**: `typecheck` runs `tsc -p tsconfig.build.json`, which
  excludes `test/` and `**/*.spec.ts`. Pre-existing for every spec in the repo.
