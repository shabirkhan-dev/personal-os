---
from: human
to: all
priority: high
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Prevent concurrent refresh-token rotation

## Context

The backend rotates refresh tokens and treats reuse of an old token as a
session-revoking event. Both the web and mobile auth contexts can start a
refresh from independent triggers (scheduled refresh, profile refresh, or a
401 retry) without a shared in-flight promise/lock. Two requests can therefore
refresh the same session concurrently; the second can look like token reuse and
log the user out.

Relevant code: `apps/web/src/modules/auth/context/auth-context.tsx`,
`apps/mobile/src/modules/auth/context/auth-context.tsx`, and the refresh
contract in `apps/docs/content/docs/backend-api.mdx`.

## Requested outcome

Make refresh single-flight per client session, queue callers behind the same
refresh, and ensure a failed refresh clears the session only once. Cover the
401 retry path as well as scheduled/profile refresh.

## Definition of done

- Concurrent refresh callers result in one network refresh request.
- Waiting callers receive the resulting session or the same failure.
- Web and mobile tests cover simultaneous timer/401 refreshes and retry safety.
- No backend contract change is made without updating the API docs.

## Resolution

(open)
