---
from: human
to: mobile
priority: high
status: doing
assignee: mobile
reviewer: reviewer (independent agent session)
type: implementation
branch: agent/mobile/auth-route-guard
worktree: ../personal-os-worktrees/agent/mobile/auth-route-guard
scope:
  - apps/mobile/src/app/**
  - apps/mobile/src/modules/auth/**
  - apps/mobile/src/components/providers.tsx
  - apps/mobile/package.json
  - apps/mobile/jest.config.ts
allowed_shared: []
created: 2026-08-24
updated: 2026-08-24
---

# Guard mobile module routes during auth bootstrap

> Claimed by the mobile agent. Scope note: also introduces the minimal mobile
> test runner (jest-expo + React Navigation/Router testing setup) required by
> this card's "focused tests" definition of done — recorded here because every
> wave 1–2 card depends on it.

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

Implementation complete on branch `agent/mobile/auth-route-guard` (commit
`ce15fc4`, pushed). Awaiting independent review — card stays in `doing/` until
review is recorded.

### Changed

- `apps/mobile/src/app/_layout.tsx` — splash screen now hides only after auth
  bootstrap resolves; root stack moved inside the provider tree.
- `apps/mobile/src/app/(modules)/_layout.tsx` — renders nothing during
  bootstrap, redirects unauthenticated users to `/(auth)/login`.
- `apps/mobile/src/app/(auth)/_layout.tsx` — redirects authenticated users to
  `/(modules)/(dashboard)` (fixes deep-link spin on auth screens).
- `apps/mobile/jest.config.js`, `apps/mobile/tests/stubs/empty-module.js`,
  `apps/mobile/src/types/css-modules.d.ts` — new minimal jest-expo test setup.
  Includes a Bun-store-aware `transformIgnorePatterns` (`node_modules/.bun/<pkg>
  @ver+hash/node_modules/…`) without which transpiled packages ship raw ESM to
  jest under Bun workspaces.
- `apps/mobile/package.json` — real `test: jest` script; devDeps jest,
  jest-expo, @types/jest, @testing-library/react-native, @babel/runtime.
- `apps/mobile/tsconfig.json` — explicit `"types": ["jest"]` (TS 6 does not
  auto-include `@types/*` here).
- Tests: `root-layout.test.tsx`, `(auth)/auth-layout.test.tsx`,
  `(modules)/modules-layout.test.tsx`, `auth-context.test.tsx`.

### Validation

- `bun --cwd apps/mobile run test`: 4 suites, 10 tests passed
- `bun --cwd apps/mobile run lint`: Biome clean (155 files)
- `bun --cwd apps/mobile run typecheck`: 0 errors
- root `bun run typecheck` (turbo): 5 tasks successful incl. mobile
- `bun run architecture:check`: boundaries + naming OK

### Contract impact

None (no API change).

### Review

Pending — reviewer: independent reviewer agent session. Requested via board.

### Follow-ups / honest limitations

- Device/simulator verification of cold start, sign-out, sign-in, and
  expired-session navigation was **not** run in this environment (no emulator);
  covered by focused unit tests instead per card DoD "focused tests or an
  equivalent e2e check". Reviewer or QA should smoke-test on device before
  store-facing builds.
- Scope note recorded at claim time: this card also introduced the mobile test
  runner required by wave 1–2 cards' DoDs.
