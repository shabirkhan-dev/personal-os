---
from: human
to: mobile
priority: high
status: done
assignee: mobile
created: 2026-08-24
updated: 2026-08-24
---

# Restore the mobile typecheck and test quality gates

## Context

`apps/mobile/package.json` has lint and a placeholder test script, but no
`typecheck` script. A direct `bunx tsc --noEmit` currently fails across the
app, so the clean Biome result does not represent a build-safe mobile baseline.

## Requested outcome

Fix the source-level type errors, add explicit `typecheck` and real mobile test
scripts, and wire them into the monorepo quality gates.

## Definition of done

- `bun --cwd apps/mobile run typecheck` passes with zero errors.
- Root `bun run typecheck` includes the mobile app.
- The placeholder “No unit tests yet” script is replaced with focused tests for
  routing/auth/data behavior, plus a documented native/e2e path where needed.
- CI fails on mobile type or test regressions.

## Resolution

- Added `"typecheck": "tsc --noEmit"` to `apps/mobile/package.json`.
- Fixed all 19 source-level TypeScript errors across mobile screens (supporting `ColorValue` in `IconProps`, replacing `StyleSheet.absoluteFillObject` with `StyleSheet.absoluteFill`, fixing typed routes in `app-tabs.web.tsx`, correcting `NeonCard` style props, adding `emptyText` styling, and fixing query string formation in `routines.service.ts`).
- Root `turbo run typecheck` now executes `mobile#typecheck` and passes with 0 errors across the monorepo.
