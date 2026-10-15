---
id: pos-23
title: fix the android release build (expo-sqlite r8) and set the hyperdrive id
type: bug
from: human
to: mobile
priority: high
status: done
assignee: mobile
reviewer: human
parent: none
depends_on: []
branch: agent/mobile/expo-sqlite-release-build
worktree: none
scope:
  - apps/mobile/package.json
  - package.json (overrides)
  - bun.lock
  - apps/api/wrangler.jsonc
allowed_shared: []
created: 2026-10-15
updated: 2026-10-15
---

## What

The EAS `preview` build failed in `:app:minifyReleaseWithR8`: `Missing class
io.github.expo.modules.v2.async.PromiseHandle (referenced from expo.modules.sqlite.NativeDatabase…)`.
Also: the API's Hyperdrive config now exists.

## Why / Context

`expo-sqlite@58.0.13` (Expo Modules API 2.0) was released with `expo-modules-core@58.0.18`, which
pins the v2 runtime 0.2.5. The root `overrides` held `expo` at 58.0.7, so the app resolved
`expo-modules-core@58.0.15` (v2 0.2.4), which lacks that class.

## Resolution

Changed: `expo` 58.0.7 → 58.0.10 (root override and app), every Expo native package aligned to
`expo/bundledNativeModules.json` (0 mismatches; `expo install --check` cannot reach Expo's API
from the sandbox), `expo-modules-core` now 58.0.18. Hyperdrive id
`037e090d79784cac818deb6acb9177e2` in `apps/api/wrangler.jsonc`.

Validation: mobile typecheck clean, 207 tests pass, `expo export --platform android` bundles
(2210 modules), lint clean. Not verified here: the Gradle release build itself (needs EAS).

Contract impact: none.
