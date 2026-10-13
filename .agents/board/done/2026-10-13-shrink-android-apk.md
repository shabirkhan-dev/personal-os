---
id: pos-13
title: Shrink the Android APK
type: chore
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
scope: ["apps/mobile/app.config.js", "apps/mobile/package.json", "apps/mobile/README.md", "bun.lock"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

The sideloaded APK was 102 MB for a small app.

## Why / Context

A universal APK carries the native libraries (React Native, Hermes, Reanimated, SVG, screens,
gesture handler) for four ABIs, about 20–25 MB each, and release builds were not shrunk. The
owner's phone is a Galaxy S23 Ultra (arm64-v8a).

## Proposal or Ask

Per-profile Android settings with `expo-build-properties`.

## Scope

**In scope:** see `scope`. **Out of scope:** removing features or dependencies.

## Validation

- resolved config per profile and an Android prebuild

## Resolution

Changed:
- `app.config.js` layers per-profile settings over `app.json`:
  - `development` and `preview`: `buildArchs: ["arm64-v8a"]`, `useLegacyPackaging: true` (compressed `.so` files)
  - all release builds: `enableMinifyInReleaseBuilds` (R8) and `enableShrinkResourcesInReleaseBuilds`
  - `production` keeps all ABIs (Play splits the AAB per device); a local run with no profile keeps them for emulators
- `expo-build-properties@~58.0.10`; README section "Build size"

Validation:
- `expo config` per profile shows the expected plugin options
- `EAS_BUILD_PROFILE=preview expo prebuild`: `reactNativeArchitectures=arm64-v8a`, `expo.useLegacyPackaging=true`, `android.enableMinifyInReleaseBuilds=true`, `android.enableShrinkResourcesInReleaseBuilds=true` in Gradle (generated folder removed afterwards)

Expected: the preview APK drops from about 102 MB to roughly 25–35 MB. Confirm with the next
`preview` build; it is a native change, so it needs a new build, not an EAS Update.
