---
id: pos-2
title: Align react-native with the Expo SDK 58 pin
type: chore
from: pm
to: mobile
priority: high
status: open
assignee: none
reviewer: human
parent: none
depends_on: []
branch: none
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

_Open._
