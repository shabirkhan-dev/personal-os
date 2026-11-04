---
id: pos-48
title: Sleek pass, no outline rings, smaller cards and buttons
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: []
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/src/**", "packages/tokens/src/color.ts", "DESIGN.md"]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

The owner found the cards and buttons gigantic and the outline rings meaningless, and asked for a
sleeker, more modern UI.

## Proposal or Ask

- A codemod over every style object with a card radius (24 to 32): radius 20, outline removed,
  padding 16; radius 22 became 16. Circles and pills (radius ≥ half the width or height) were
  left alone; 1.5px selected and input borders kept.
- PillButton 52 → 44px, ask bar 52 → 46px, tab bar 52 → 44px items with no border, header and
  module-pill buttons with no ring, the Daily "Next" card tinted instead of outlined.
- Minimum day: the five SVG rings became compact chips (dot or check, label, value, a 2px bar).
- Light `bgApp` `#ffffff` → `#f5f5f5` so borderless white cards still separate. Recorded in
  DESIGN.md as a decision against Figma.

## Validation

- Typecheck and oxlint clean; 317 mobile tests pass.
- Web export screenshots, dark and light: Home, Minimum day, Training, Finance, Profile.

## Resolution

Landed on `ccr-cdb9b079-navb5d` (PR #89).
