---
id: pos-17
title: Fix the Home crash on device (toSorted on Hermes)
type: bug
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: []
branch: ccr-f7a44e55-46aj0i
worktree: none
scope: ["apps/mobile/src/**", ".oxlintrc.json"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

Opening Home on the phone (signed out, the normal case while the API is not deployed) crashed
the app or showed a blank screen.

## Resolution

Cause: `todayItems` sorted with `Array.prototype.toSorted` (ES2023). It exists in browsers and Bun,
so web previews and tests passed, but it is not guaranteed on Hermes and nothing polyfills it; Home
throws on its first render. It came in through oxlint's `unicorn/no-array-sort`, which suggests
`toSorted()`.

Changed:
- `today.ts`: `[...items].sort(...)`.
- `today.test.ts`: regression test with `Array.prototype.toSorted` removed (fails on the old code
  with "items.toSorted is not a function", passes now).
- `.oxlintrc.json`: `unicorn/no-array-sort` and `unicorn/no-array-reverse` off for `apps/mobile`.
- `(home)/_layout.tsx` exports an Expo Router `ErrorBoundary` (`components/route-error.tsx`):
  a render error shows the message and "Try again" instead of a crash or blank screen.

Validation: mobile typecheck, oxlint (0 warnings), tests 36 pass.

Not verified on a device from here (no Hermes runtime in the container); the owner confirms on
the next build or update.
