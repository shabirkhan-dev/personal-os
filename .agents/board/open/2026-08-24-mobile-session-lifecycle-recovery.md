---
from: human
to: mobile
priority: high
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Recover mobile sessions after backgrounding and access-token expiry

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

(open)
