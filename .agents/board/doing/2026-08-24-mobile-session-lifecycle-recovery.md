---
from: human
to: mobile
priority: high
status: doing
assignee: mobile
reviewer: reviewer (independent agent session)
type: implementation
branch: agent/mobile/session-lifecycle
worktree: ../personal-os-worktrees/agent/mobile/session-lifecycle
scope:
  - apps/mobile/src/modules/auth/context/auth-context.tsx
  - apps/mobile/src/lib/api/**
allowed_shared: []
created: 2026-08-24
updated: 2026-08-24
---

# Recover mobile sessions after backgrounding and access-token expiry

> Claimed by the mobile agent. Also delivers the **mobile half** of
> `2026-08-24-auth-refresh-single-flight.md` (client-side single-flight +
> 401 retry); the web half of that card remains open for the web agent.
> Stacked on `agent/mobile/query-cache-isolation` (wave 1b) → merge order:
> auth-route-guard → query-cache-isolation → this branch.

## Context

The auth context schedules one refresh timer from the token expiry, but it does
not revalidate on `AppState` foreground/resume. The API client also has no
authenticated 401 retry path. A device that sleeps, loses connectivity, or
resumes after expiry can leave the user signed in locally while every protected
query fails until a restart.

Relevant code: `src/modules/auth/context/auth-context.tsx` and
`src/lib/api/client.ts`. Coordinate with the existing
`2026-08-24-auth-refresh-single-flight.md` card.

## Requested outcome

Refresh or revalidate when the app returns to the foreground and add a guarded
401 retry that shares the in-flight refresh. Do not retry non-auth failures or
loop when refresh has been rejected.

## Definition of done

- Resume after a long background period restores a valid session when possible.
- The original request retries once with the new access token.
- Invalid refresh tokens clear the session and route safely to auth.
- Tests cover background/resume, offline-to-online recovery, 401 retry, and
  refresh failure.

## Resolution

Implementation complete on branch `agent/mobile/session-lifecycle` (pushed).
Stacked on `agent/mobile/query-cache-isolation` → merge order: auth-route-guard
→ query-cache-isolation → session-lifecycle. Awaiting independent review.

### Changed

- `apps/mobile/src/modules/auth/context/auth-context.tsx`:
  - module-level single-flight refresh — bootstrap, expiry timer, foreground
    resume, and 401 retries all join one in-flight `POST /auth/refresh`
    (protects against backend refresh-rotation reuse revocation);
  - `AppState` listener revalidates on resume when the access token is
    expired or expiring within 60s; no-op when signed out;
  - registers an `AccessTokenRefresher` with the API client; failed recovery
    tears the session down once and returns null.
- `apps/mobile/src/lib/api/client.ts` — guarded single retry for bearer
  requests rejected with 401; retries only once (`isAuthRetry` flag), never
  for non-auth failures, never for token-less requests, never loops when
  refresher returns null.
- Tests: new `client.test.ts` (5 cases: retry-once-with-new-token, no loop on
  failed refresh, concurrent callers fail cleanly, no retry without bearer,
  no retry on 5xx) and `auth-session-lifecycle.test.tsx` (foreground refresh
  when expired / skip when valid, concurrent triggers join one network call,
  refresher hands out new token / clears session on failure).

### Validation

- `bun --cwd apps/mobile run test`: 7 suites, 25 tests passed
- `bun --cwd apps/mobile run lint`: Biome clean
- `bun --cwd apps/mobile run typecheck`: 0 errors
- root `bun run typecheck` (turbo): 5 tasks successful incl. mobile
- `bun run architecture:check`: boundaries + naming OK

### Contract impact

None (no backend contract change).

### Review

Pending — reviewer: independent reviewer agent session.

### Follow-ups / honest limitations

- Offline-to-online recovery is covered indirectly (resume triggers revalidate;
  unreachable-API requests surface `API_UNREACHABLE` and are not retried as
  auth failures). True device background/resume verification not run in this
  environment — reviewer/QA should smoke-test on device.
- Web half of `2026-08-24-auth-refresh-single-flight.md` remains open.
