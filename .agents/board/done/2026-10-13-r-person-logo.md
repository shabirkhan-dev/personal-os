---
id: pos-15
title: Replace the logo with the R-person mark
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
scope: ["apps/mobile/assets/images/**", "apps/mobile/app.json", "apps/mobile/src/components/icons/logo-mark.tsx", "apps/web/src/app/**", "apps/web/public/**"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

Swap the four-tile logo for the approved R-person mark (an R that is also a person striding
forward; the dot is the head). Mark only, no wordmark. The landing page says both Android and iOS
are coming soon.

## Why / Context

The owner picked the "Roz · Plan Track Grow" concept. It was redrawn as a vector in Figma (page
"Roz · Logo", frame "Roz · Logo · Exact · R-person") from the owner's reference image.

## Scope

**In scope:** see `scope`. The app name stays "Personal OS" for now.

## Validation

- mobile typecheck, lint, tests; architecture check; asset renders checked by eye

## Resolution

Changed:
- Figma: component "Logo / Roz mark" (was "Logo / Personal OS mark", 8:264) now holds the mark with
  no tile, so all 20 instances (onboarding, landing) update. Landing desktop and mobile: both store
  buttons read "coming soon", the badge reads "COMING SOON · ANDROID & IOS", and the closing call
  to action collects an email for launch day.
- `apps/mobile/assets/images`: new `icon.png` (white), adaptive icon foreground, background and
  monochrome layers, and `splash-icon.png`, all rendered from one SVG of the mark.
  `android.adaptiveIcon.backgroundColor` is now white.
- `LogoMark` draws the same geometry with `react-native-svg` gradients and a clip path. It is brand
  artwork, so it keeps its own colours instead of theme tokens.
- `apps/web`: `public/roz-mark.svg` on the landing shell, plus `app/icon.svg` and
  `app/apple-icon.png`.

Validation:
- mobile typecheck, oxlint, oxfmt, architecture and naming checks: clean; mobile tests: 34 pass
- `bun run lint` stops at `shellcheck`, which is not installed in this container
- `apps/web` is disabled in the workspace, so it was not built

The app icon and splash only change in a new build.
