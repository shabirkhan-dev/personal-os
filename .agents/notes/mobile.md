# Mobile agent notes (frontend)

> Owner: mobile agent. Others: read-only — raise a card to reach us.

## Current focus

- Wave 1 (auth/session correctness) implemented, awaiting review: auth-route-guard (`ce15fc4`) → query-cache-isolation (`4ad389e`) → session-lifecycle (single-flight refresh + AppState resume + 401 retry). Merge order = stack order.

## API consumption

- Read `apps/docs/content/docs/backend-api.mdx` before wiring any endpoint.
- Routines v1 is live and consumed in the `(modules)/(routines)` route group.

## Log

- 2026-08-24: claimed `mobile-auth-route-guard`; added jest-expo test infra (bun-store transformIgnorePatterns fix), guarded `(modules)`/`(auth)` layouts, gated splash on bootstrap. 10 tests green; awaiting review.
- 2026-08-24: claimed `mobile-query-cache-user-isolation`; routines keys user-scoped, clearSession wipes React Query cache. 15 tests green.
- 2026-08-24: claimed `mobile-session-lifecycle-recovery` (+ mobile half of `auth-refresh-single-flight`); single-flight refresh, AppState revalidation on resume, guarded 401 retry in api client. 25 tests green.
