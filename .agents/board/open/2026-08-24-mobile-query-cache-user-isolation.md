---
from: human
to: mobile
priority: high
status: open
assignee: none
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

(open)
