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

Implementation complete on branch `agent/mobile/query-cache-isolation`
(commit `4ad389e`, pushed). Stacked on `agent/mobile/auth-route-guard` (wave
1a) to inherit the test infrastructure; merge order must be 1a → this branch.
Awaiting independent review.

### Changed

- `apps/mobile/src/modules/routines/hooks/use-routine-queries.ts` — all
  protected keys are now user-scoped (`["routines", userId, …]`, matching the
  finance pattern); hooks gate on `token && user`, so queries stay disabled
  while bootstrap is unresolved. Mutation prefix invalidation
  (`["routines"]`) is unaffected.
- `apps/mobile/src/modules/auth/context/auth-context.tsx` — `clearSession`
  now calls `queryClient.clear()` via `useQueryClient`; covers logout,
  logoutAll, refresh failure, and failed cold-start bootstrap.
- Tests: new `use-routine-queries.test.tsx` (key scoping, disabled-during-
  bootstrap, per-account cache separation) and two cache-wipe cases in
  `auth-context.test.tsx` (failed bootstrap, logout).
- `providers.tsx` needed no change (QueryClient already created above
  AuthProvider); scope entry unused by design.

### Validation

- `bun --cwd apps/mobile run test`: 5 suites, 15 tests passed
- `bun --cwd apps/mobile run lint`: Biome clean
- `bun --cwd apps/mobile run typecheck`: 0 errors
- root `bun run typecheck` (turbo): 5 tasks successful incl. mobile
- `bun run architecture:check`: boundaries + naming OK

### Contract impact

None (no API change).

### Review

Pending — reviewer: independent reviewer agent session.

### Follow-ups / honest limitations

- Device verification of account-switch flows not run in this environment;
  covered by unit tests per card DoD.
- Compatible with single-flight refresh card (`2026-08-24-auth-refresh-single-flight`):
  cache clearing happens in `clearSession` regardless of which path invokes it.
