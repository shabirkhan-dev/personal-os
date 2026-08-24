# Mobile agent notes (frontend)

> Owner: mobile agent. Others: read-only — raise a card to reach us.

## Current focus

- Wave 1 (auth/session correctness): `mobile-auth-route-guard` done pending review (`agent/mobile/auth-route-guard`, `ce15fc4`). Next: query-cache user isolation, then session lifecycle recovery.

## API consumption

- Read `apps/docs/content/docs/backend-api.mdx` before wiring any endpoint.
- Routines v1 is live and consumed in the `(modules)/(routines)` route group.

## Log

- 2026-08-24: claimed `2026-08-24-mobile-auth-route-guard`; added jest-expo test infra (bun-store transformIgnorePatterns fix), guarded `(modules)`/`(auth)` layouts, gated splash on bootstrap. 10 tests green; awaiting review.
