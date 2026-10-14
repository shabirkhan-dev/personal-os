---
id: pos-11
title: Module dashboards from the Figma Home page
type: feature
from: pm
to: mobile
priority: normal
status: done
assignee: none
reviewer: human
parent: pos-5
depends_on: []
branch: none
worktree: none
scope: ["apps/mobile/src/app/(home)/**", "apps/mobile/src/modules/home/**"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-15
---

## What

Build the Finance, Workout and Skincare module views (Figma page "Home", frames 67:438, 67:681,
67:1020) and open them from the module picker.

## Why / Context

Home v1 (pos-5) ships the Overview and the picker; choosing a module only closes the picker.

## Proposal or Ask

Build the widgets from the Figma "Widgets" page (Spend Breakdown, Range Bar, Stat Target,
Forecast, Daily Bars, Activity Grid, Day Range, Stat Strip) as Kit v2 components, then the three
views. Real data needs the module APIs; until then show empty states, not sample numbers.

## Scope

**In scope:** `apps/mobile/src/app/(home)/**`, `apps/mobile/src/modules/home/**`

**Out of scope:** module APIs (raise backend cards).

## Validation

- mobile lint, typecheck, test
- screenshots in Dark and Light vs the Figma frames

## Resolution

Superseded on 2026-10-15: the module Homes shipped in `2026-10-14-home-module-screens`
(Finance, Workout, Skincare, Food, Profile), with on-device data instead of module APIs.
