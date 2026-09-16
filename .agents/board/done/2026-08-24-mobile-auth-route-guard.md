---
from: human
to: mobile
priority: high
status: done
assignee: mobile
reviewer: reviewer (independent agent session)
type: implementation
branch: none
worktree: none
scope:
  - apps/mobile/src/app/**
  - apps/mobile/src/modules/auth/**
  - apps/mobile/src/components/providers.tsx
  - apps/mobile/package.json
  - apps/mobile/jest.config.ts
allowed_shared: []
created: 2026-08-24
updated: 2026-09-16
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

Implementation complete. Awaiting independent review — card stays in `doing/`
until review is recorded.

### Changed

Follow-up review round (`e93bc44`, `b75f0fa`):
- `apps/mobile/src/tests/app/modules-layout.test.tsx`,
  `apps/mobile/src/tests/app/auth-layout.test.tsx` — added session-transition
  routing coverage requested by review:
  - cold-start bootstrap → covered by `auth-context.test.tsx`
    ("restores the session on cold start…") plus splash-gate test;
  - sign-out teardown routes `(modules)` → `/(auth)/login` (also covers
    expired-session refresh failure, which tears the session down through the
    same `clearSession` path);
  - sign-in re-entry returns `(modules)` to module screens;
  - authenticated deep link into `(auth)` bounces to dashboard once bootstrap
    resolves (no stuck auth form);
  - post-sign-out `(auth)` renders forms again.
- **Route-tree fix found during Expo web export:** colocated `*.test.tsx`
  files under `src/app/**` were exported as phantom routes
  (`/(modules)/modules-layout.test`). All three app-dir test files moved to
  `src/tests/app/` with adjusted imports; export is clean.

Initial round (`ce15fc4`) — unchanged behavior, no refactors beyond scope:
- `apps/mobile/src/app/_layout.tsx` — splash hides only after bootstrap.
- `apps/mobile/src/app/(modules)/_layout.tsx` — null while loading; redirects
  unauthenticated users to `/(auth)/login`.
- `apps/mobile/src/app/(auth)/_layout.tsx` — redirects authenticated users to
  `/(modules)/(dashboard)`.
- `apps/mobile/jest.config.js`, `tests/stubs/empty-module.js`,
  `src/types/css-modules.d.ts`, `package.json`, `tsconfig.json` — jest-expo
  infra incl. Bun-store-aware `transformIgnorePatterns`.

### Validation

Round 2 (exact commands from review):
- `bun --cwd apps/mobile run lint`: Biome clean
- `bun --cwd apps/mobile run typecheck`: 0 errors
- `bun --cwd apps/mobile run test -- --runInBand`: 4 suites, **14 tests passed**
- root `bun run architecture:check`: boundaries + naming OK

Smoke verification:
- `expo export --platform web` succeeds; `index.html` emitted; no phantom test
  routes after `b75f0fa`. Native device/emulator unavailable in this
  environment — recorded as honest limitation; unit coverage stands in per
  card DoD ("focused tests or an equivalent e2e check").

### Contract impact

None (no API change).

### Review

**Approved** (reviewer, 2026-09-16) — independent session, re-running the checks rather than
trusting the self-report. Reviewed tip `b75f0fa`; delivered to `main` via `fbc6eb2`.

Confirmed:

- `bun --cwd apps/mobile run test -- --runInBand` — **7 suites, 34 tests pass** (cumulative across
  the wave-1 mobile stack); `typecheck` — 0 errors; `bun run architecture:check` — boundaries +
  naming OK (753 paths).
- Guards are correct and complete: `_layout.tsx` hides the splash only after `loading` resolves;
  `(modules)/_layout.tsx` returns `null` while loading and redirects to `/(auth)/login` without a
  token; `(auth)/_layout.tsx` bounces an authenticated user to `(modules)/(dashboard)`. No
  protected screen renders during bootstrap.
- Every DoD line has a matching test: cold start, splash gate, unauthenticated redirect,
  authenticated deep-link bounce, sign-out teardown (sharing `clearSession` with expired-refresh
  failure), sign-in re-entry.
- Round-2 items are genuinely addressed, including the phantom-route defect: colocated
  `*.test.tsx` under `src/app/**` were exported as routes (`/(modules)/modules-layout.test`);
  moving them to `src/tests/app/` is verified by a clean `expo export --platform web` route list.
- Accepted honest limitation: no native device/emulator verification was possible. The DoD
  permits "focused tests or an equivalent e2e check", so unit coverage satisfies it. Device smoke
  coverage belongs to `2026-08-24-mobile-accessibility-baseline.md` and
  `2026-08-24-ai-mvp-verification.md`, not here.

Findings (non-blocking, frontmatter only — no rework required):

- **V1 (low) — `scope` names a file that does not exist.** Scope lists
  `apps/mobile/jest.config.ts`; the delivered file is `apps/mobile/jest.config.js` (the card's own
  Changed list says `.js`). Scope also omits paths the work needed and which the body discloses:
  `apps/mobile/src/tests/**`, `apps/mobile/tests/stubs/**`, `apps/mobile/src/types/css-modules.d.ts`,
  `apps/mobile/tsconfig.json`, `bun.lock`. The claim-note disclosure is accepted as the required
  declaration; only the frontmatter is imprecise.
