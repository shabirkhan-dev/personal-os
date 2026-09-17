/**
 * Deterministic environment for the unit suite.
 *
 * Unit specs build a real `AppConfigService`, which parses `process.env` at construction
 * (`app.config.ts` -> `parseEnv()`), and vitest loads no `.env`. Those specs therefore read
 * whatever the developer's shell happens to export. The dev shell exports
 * `AUTH_DEV_EXPOSE_CODES=false` from the root `.env`, while `apps/nest-api/.env` sets `true`,
 * so `auth.service.spec.ts` passed in CI and failed on a workstation.
 *
 * Assign the values outright rather than trusting the ambient environment or a `.env` load.
 * This is the same remedy applied to the ai-api service-token fixture in `099a15e`: a stale
 * exported value must not be able to win. Only the variables the unit suite's identity and
 * crypto behavior depends on are pinned; every other variable keeps its schema default.
 *
 * The considered alternative was giving each spec an explicit config instead. That was
 * rejected: `AuthService` alone reads eleven config getters (`exposeAuthCodes`, the TTLs,
 * `maxLoginAttempts`, `webAppUrl`, ...), so a hand-rolled stub would be large and easy to get
 * subtly wrong, and `AppConfigService` hardcodes `createAppConfig()` with no injection seam
 * for a spec to pass one through. Pinning at the harness also protects specs added later.
 */
process.env.NODE_ENV = 'test';
process.env.AUTH_DEV_EXPOSE_CODES = 'true';
process.env.AUTH_TOKEN_SECRET = 'test-only-auth-token-secret-not-for-production';
process.env.JWT_SECRET = 'test-only-jwt-secret-not-for-production';
