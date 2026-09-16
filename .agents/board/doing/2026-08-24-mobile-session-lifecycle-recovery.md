---
from: human
to: mobile
priority: high
status: doing
assignee: mobile
reviewer: reviewer (independent agent session)
type: implementation
branch: none
worktree: none
scope:
  - apps/mobile/src/modules/auth/context/auth-context.tsx
  - apps/mobile/src/lib/api/**
allowed_shared: []
created: 2026-08-24
updated: 2026-09-16
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

Implementation complete (tip `3544a55` after rebase onto the round-2 fixes).
Stacked on `agent/mobile/query-cache-isolation` → merge order: auth-route-guard
(`b75f0fa`) → query-cache-isolation (`0745e91`) → session-lifecycle
(`3544a55`). Awaiting independent review.

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

**Changes requested** (reviewer, 2026-09-16) — the *delivered code is correct*, but this card's
evidence describes a revision that was superseded, and it does not record the defect that forced
the supersession. No code change is required; the Resolution needs to point at what actually
shipped. Reviewed tip `3544a55`; delivered to `main` via `fbc6eb2`.

Confirmed:

- `bun --cwd apps/mobile run test -- --runInBand` — **7 suites, 34 tests pass**; `typecheck` —
  0 errors; `bun run architecture:check` — OK.
- Current `main` behaviour is correct: the guarded single retry in `client.ts:96-105` fires only
  for bearer requests, only once (`isAuthRetry`), never loops when the refresher returns `null`,
  and never retries non-auth failures — all five `client.test.ts` cases are real and pass.
  `AppState` resume revalidation (`auth-context.tsx:151-166`) no-ops when signed out and joins the
  shared in-flight refresh, as do the expiry timer and bootstrap.

Findings:

- **V1 — the card's tip is not the delivered revision, and the missing fix is a real bug.** The
  card names tip `3544a55` and describes "**module-level** single-flight refresh". Commit `99ba6d7`
  (2026-08-25, authored by the human, not the mobile agent) replaced the module-level
  `inFlightRefresh` singleton with a per-provider `inFlightRefreshRef` plus `sessionGenerationRef`
  and re-guarded `establishSession`/`clearSession` on a generation counter. That is a correctness
  fix, not a refactor: it added the tests "cannot restore account A after logout and replacement
  login as account B" and "cannot clear account B when account A's stale refresh fails". The
  reviewed revision therefore had a user-visible defect — after switching accounts, a stale
  refresh belonging to the previous account could clear or resurrect the new session (and the
  module-level singleton was shared beyond a single provider instance). The card neither names
  `99ba6d7` nor records that defect. Action: update Resolution/tip to the delivered revision and
  record the superseding fix and its cause before this moves to `done/`.
- **Note (not a defect) — the two account-switch tests in the current suite come from `99ba6d7`,
  not from the reviewed range.** They must not be counted as evidence for `3544a55`.
- Honest limitation correctly disclosed by the implementation agent: no true device
  background/resume verification. Handed to QA; consistent with the card's own note.

### Follow-ups / honest limitations

- Offline-to-online recovery is covered indirectly (resume triggers revalidate;
  unreachable-API requests surface `API_UNREACHABLE` and are not retried as
  auth failures). True device background/resume verification not run in this
  environment — reviewer/QA should smoke-test on device.
- Web half of `2026-08-24-auth-refresh-single-flight.md` remains open.
