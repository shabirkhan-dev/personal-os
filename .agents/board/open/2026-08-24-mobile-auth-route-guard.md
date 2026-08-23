---
from: human
to: mobile
priority: high
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Guard mobile module routes during auth bootstrap

## Context

The root layout starts on `(modules)`, while the module layout has no auth
redirect or loading gate. Module screens can therefore render for an
unauthenticated user, and a deep link into `(auth)` while already signed in can
leave the auth form spinning. The root layout also hides the splash screen
immediately instead of waiting for auth bootstrap.

Relevant code: `apps/mobile/src/app/_layout.tsx`,
`apps/mobile/src/app/(modules)/_layout.tsx`, and the mobile auth context.

## Requested outcome

Make the root/layout navigation auth-aware: wait for bootstrap, redirect
unauthenticated users to auth, redirect authenticated users away from auth, and
hide the splash screen only after the initial route decision is safe.

## Definition of done

- No protected module screen is reachable without an authenticated session.
- Authenticated deep links do not get stuck on a loading auth form.
- Cold start, sign-out, sign-in, and expired-session navigation are covered by
  focused tests or an equivalent e2e check.
- The behavior works on native and web targets supported by the app.

## Resolution

(open)
