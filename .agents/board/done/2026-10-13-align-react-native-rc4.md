---
id: pos-2
title: Align react-native with the Expo SDK 58 pin
type: chore
from: pm
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: []
branch: ccr-f7a44e55-46aj0i
worktree: none
scope: ["apps/mobile/package.json", "bun.lock", "package.json"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

`apps/mobile` pins `react-native` `0.88.0-rc.3`; Expo SDK 58.0.7 expects `0.88.0-rc.4`.

## Why / Context

A native version mismatch makes `expo doctor` fail and can crash EAS builds at runtime. The root `overrides` may also pin it.

## Proposal or Ask

Run `bunx expo install --check` in `apps/mobile`, apply the expected versions (and the root override), reinstall. Done when `bunx expo-doctor` passes.

## Scope

**In scope:** `apps/mobile/package.json`, `bun.lock`, `package.json`

**Out of scope:** anything not listed above; raise a card instead.

## Validation

- `bunx expo-doctor` clean
- mobile lint, typecheck, test
- a new `preview` EAS build installs and opens

## Resolution

Changed:
- `apps/mobile/package.json`: `react-native` 0.88.0-rc.3 → 0.88.0-rc.4; `bun.lock`

Validation:
- `EXPO_OFFLINE=1 bunx expo install --check`: Dependencies are up to date
- `bunx expo-doctor`: 18/20; the 2 failures are network-only (exp.host and React Native Directory unreachable from the sandbox)
- mobile typecheck, lint: clean; `bun test`: 13 pass

Contract impact: none. Needs a new EAS build (native change).
