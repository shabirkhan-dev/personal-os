---
from: human
to: mobile
priority: high
status: doing
assignee: mobile
reviewer: reviewer (independent agent session)
type: implementation
branch: agent/mobile/query-cache-isolation
worktree: ../personal-os-worktrees/agent/mobile/query-cache-isolation
scope:
  - apps/mobile/src/modules/routines/hooks/**
  - apps/mobile/src/modules/auth/context/auth-context.tsx
  - apps/mobile/src/components/providers.tsx
allowed_shared: []
created: 2026-08-24
updated: 2026-08-24
---

# Isolate and clear authenticated mobile query caches

## Context

`useTodayQuery` uses the global key `['routines', 'today']` without a user
identity. `AuthProvider.clearSession` clears tokens and SecureStore but does not
clear the React Query cache. If one user signs out and another signs in within
the cache freshness window, the previous user’s routines can be rendered before
the new request completes.

Relevant code: `src/modules/routines/hooks/use-routine-queries.ts`,
`src/components/providers.tsx`, and `src/modules/auth/context/auth-context.tsx`.

## Requested outcome

Scope every protected query key by user ID and clear or remove authenticated
query data on logout/session identity changes. Treat cached data as sensitive
even when the access token is gone.

## Definition of done

- User A data cannot appear in User B’s screen during sign-out/sign-in.
- Protected queries are disabled while auth bootstrap is unresolved.
- Tests cover logout, account switching, refresh failure, and cache freshness.
- The approach remains compatible with the existing single-flight refresh card.

## Resolution

Implementation complete. Awaiting independent review.

### Changed

Review round (`0745e91`, branch rebased onto `agent/mobile/auth-route-guard`
tip `b75f0fa`):
- `apps/mobile/src/modules/auth/context/auth-context.tsx` — privacy gap fixed:
  - `previousUserIdRef` (stable `useRef`) tracks the last authenticated id;
    identity comparison deliberately stays out of effect dependency lists so
    adding deps cannot retrigger the bootstrap refresh loop;
  - on `establishSession` with a **different** user id, caches are purged
    *before* the new token/user state is exposed
    (`cancelQueries()` → `clear()`);
  - same-user refresh (timer, `refreshUser` 401 path) performs **no purge**;
  - `clearSession` uses the same purge helper and resets the ref.
- `apps/mobile/src/modules/auth/context/auth-context.test.tsx` — added:
  - real AuthProvider A→B test: establish User A, seed cached data,
    establish User B → A's rows removed from cache, B exposes no inherited
    data (`["routines","user-2",…]` undefined);
  - in-flight cleanup: hanging `fetchQuery` for A is cancelled (signal
    aborted, promise settles, entry removed) during switch;
  - freshness/same-user: seeded A data survives a same-id refresh via
    `refreshUser` 401 → single network refresh, cache preserved;
  - logout + failed-bootstrap wipe cases from round 1 kept.

Round 1 (`2a37c20` after rebase; originally `4ad389e`) — unchanged:
user-scoped routine keys `["routines", userId, …]`, hooks gated on
`token && user`, mutation prefix invalidation untouched.

### Validation

Round 2 (exact commands from review):
- `bun --cwd apps/mobile run lint`: Biome clean
- `bun --cwd apps/mobile run typecheck`: 0 errors
- `bun --cwd apps/mobile run test -- --runInBand`: 5 suites, **22 tests passed**
- root `bun run architecture:check`: boundaries + naming OK
- Smoke: `expo export --platform web` succeeds, clean route list (no test-file
  routes), `index.html` emitted.

### Contract impact

None (no API change).

### Review

Pending — reviewer: independent reviewer agent session. Review items addressed
in `0745e91`; merge order auth-route-guard → this branch.
