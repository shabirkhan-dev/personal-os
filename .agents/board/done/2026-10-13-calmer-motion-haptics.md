---
id: pos-14
title: Calmer onboarding motion and haptic feedback
type: feature
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
scope: ["apps/mobile/src/**", "apps/mobile/package.json", "bun.lock"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

The onboarding animations felt too aggressive, and there was no haptic feedback.

## Why / Context

Elements dropped in with Reanimated's default 25px travel, eight places zoomed in from scale 0
with bouncy springs (damping 14), staggers ran up to ~450 ms + 80 ms per item, and loops pulsed
fast.

## Proposal or Ask

Shared calm motion presets and a small haptics helper.

## Scope

**In scope:** see `scope`.

## Validation

- mobile typecheck, lint, tests; web render check

## Resolution

Changed:
- `theme/motion.ts`: `rise()` (fade + 8px rise, 280 ms ease-out) and `pop()` (fade + 0.96→1 scale); delays halved and capped at 240 ms; system reduce-motion respected. 18 files moved off `FadeInDown`, `FadeInUp` and `ZoomIn` (including springy `ZoomIn.springify().damping(14)`).
- Loops: splash dots 300 → 520 ms with sine easing; voice bars 0.45 → 0.7 depth at 420 ms.
- `lib/haptics.ts` (`expo-haptics@~58.0.5`): `tap` on pill buttons, header buttons, chips, the Home header, tab bar and ask send; `select` on option cards, toggles, segmented controls, steppers, wheels and the ruler (one tick per value), connections, modules, workdays, suggestion chips and picker rows; `success` when onboarding finishes and on sign-in; `error` on a wrong code. Web and devices without a vibrator stay silent.

Validation:
- mobile typecheck, lint: clean; tests pass
- web export: goals, modules, plan reveal and all-set render fully after the new entrances

Native module added (`expo-haptics`), so haptics need a new build.
