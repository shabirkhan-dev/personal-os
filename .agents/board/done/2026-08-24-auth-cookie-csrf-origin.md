---
from: human
to: backend
priority: high
status: done
assignee: backend
created: 2026-08-24
updated: 2026-08-24
---

# Harden cookie-authenticated CSRF checks

## Context

`CsrfGuard` accepts every unsafe request when `Origin` is absent. The auth
module also supports refresh cookies and production `COOKIE_SAME_SITE=none`,
so missing-origin requests currently have no synchronizer-token or Referer
fallback check.

Relevant code: `apps/nest-api/src/modules/auth/csrf.guard.ts` and
`apps/nest-api/src/modules/auth/refresh-cookie.service.ts`.

## Requested outcome

Require a verifiable same-origin signal or explicit CSRF token for unsafe
cookie-authenticated browser requests. Keep native clients working through an
explicit, non-cookie path and do not treat an arbitrary client header as proof
of browser origin.

## Definition of done

- Missing, mismatched, `null`, and trusted same-origin requests are tested.
- Refresh/logout/login flows remain usable for web and native clients.
- Cookie and CSRF behavior is documented for all supported deployments.

## Resolution

`CsrfGuard` now only demands an allow-listed `Origin` for requests that carry the ambient refresh cookie. Non-cookie clients (bearer token or refresh-token-in-body) pass unchanged; missing, `null`, or mismatched origins on cookie requests are rejected. The forgeable `X-Requested-With` check was removed. Tests cover missing, mismatched, null, and trusted same-origin cases in `csrf.guard.spec.ts`.
