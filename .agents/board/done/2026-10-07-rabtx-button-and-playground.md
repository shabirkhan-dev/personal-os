---
id: str-rabtx-button-and-playground
title: Build the Rabtx Button and the new /ui playground
type: feature
from: human
to: ui-ux
priority: high
status: done
assignee: ui-ux
reviewer: human
parent: str-remove-old-playgrounds
depends_on: []
branch: agent/ui-ux/rabtx-button-and-playground
worktree: ../starter-worktrees/agent/ui-ux/rabtx-button-and-playground
scope:
  - packages/rabtx/**
  - apps/web/src/app/ui/**
  - apps/web/e2e/ui-button.spec.ts
  - apps/web/package.json
  - apps/web/next.config.ts
  - apps/web/src/app/globals.css
  - bun.lock
  - DESIGN.md
  - .agents/board/**
allowed_shared:
  - apps/web/**
  - DESIGN.md
created: 2026-10-07
updated: 2026-10-07
---

## What

The first from-scratch `@rabtx/ui` component (Button) plus the playground that showcases it, at
`/ui/button` in `apps/web`.

## Why / Context

Owner decision (2026-10-07): rebuild the library one perfect component at a time, Button first, with
a playground to show every component. Design source is the Figma Button section (node 5:6); the
depth, radius and motion decisions are locked in DESIGN.md.

## Proposal or Ask

- Tokens and modes switched by `data-theme`, `data-depth`, `data-radius` and `data-motion`.
- CSS-only springs: a solver turns stiffness, damping and mass into `linear()` easings.
- Button: five styles, five sizes, icon-only, loading that holds width, Flat and Floating depth,
  Sharp, Default and Round radius, no runtime dependencies.
- Playground: Design bar, props playground with copyable code, states matrix, sizes, depth x radius,
  in-context examples, spec and accessibility notes.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** other components, the native (Expo) Button, glass, and Figma dark values.

## Validation

- `bun run lint`, `typecheck`, `naming:check`, `architecture:check`, `format` pass.
- `bun run test` (spring solver unit tests) passes.
- `apps/web/e2e/ui-button.spec.ts`: 6 Playwright tests pass against the dev server.
- Checked in Chromium: light, dark, Flat, Floating, Sharp, Default and Round; computed styles
  against Figma; keyboard focus ring; no horizontal scroll at 375px.
- Not checked: Safari and Firefox, and the production build of `web` (needs network for `next/font`).

## Resolution

Button and playground built. Flat hover edge follows the fill so Flat stays a single border color.
Dark token values are derived, not confirmed in Figma.
