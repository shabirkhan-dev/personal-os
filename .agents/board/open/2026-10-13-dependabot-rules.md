---
id: pos-4
title: Teach Dependabot about Expo-managed and major upgrades
type: chore
from: pm
to: human
priority: normal
status: open
assignee: none
reviewer: human
parent: none
depends_on: []
branch: none
worktree: none
scope: [".github/dependabot.yml"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

Stop Dependabot from opening PRs Expo would break (react-native, react, reanimated, screens, worklets, svg, expo-*) and group or ignore major bumps.

## Why / Context

The last batch (#21–#30) was mostly obsolete or unsafe: 4 packages no longer existed and the native ones are pinned by the Expo SDK.

## Proposal or Ask

Add `ignore` entries for Expo-managed packages, `groups` for minor/patch updates, and ignore semver-major for NestJS until a planned upgrade card.

## Scope

**In scope:** `.github/dependabot.yml`

**Out of scope:** anything not listed above; raise a card instead.

## Validation

- YAML validates; next Dependabot run opens only safe PRs

## Resolution

_Open._
