---
id: str-rabtx-input
title: Build the Rabtx Input and its docs page
type: feature
from: human
to: ui-ux
priority: high
status: done
assignee: ui-ux
reviewer: human
parent: str-rabtx-docs-style-ui
depends_on: []
branch: agent/ui-ux/rabtx-input
worktree: ../starter-worktrees/agent/ui-ux/rabtx-input
scope:
  - packages/rabtx/**
  - apps/web/src/app/ui/**
  - apps/web/e2e/ui-input.spec.ts
  - DESIGN.md
  - .agents/board/**
allowed_shared:
  - apps/web/**
  - DESIGN.md
created: 2026-10-08
updated: 2026-10-08
---

## What

The second `@rabtx/ui` component, Input, with a docs page at `/ui/input`.

## Why / Context

Owner: continue one component at a time. Input follows Button in the Figma file (`6:14`) and reuses
the shared control surface and the Flat and Floating depth modes.

## Proposal or Ask

- `rx-field` tone on the shared `rx-control` surface; a `box-shadow` halo (3px) for focus and error.
- `input.styles.ts` (class strings, no framework) and a thin React `input.tsx`.
- Docs: default with label and helper, sizes, icons and pill, error and disabled, API, accessibility.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** Field (label and helper wrapper, `26:436`), Textarea, Select, the Solid and native
versions, Figma dark values.

## Validation

- `bun run lint`, `typecheck`, `naming:check`, `architecture:check`, `format` pass.
- `apps/web/e2e/ui-input.spec.ts` (5 tests) and `ui-button.spec.ts` (5 tests) pass against the dev server.
- Checked in Chromium: light, dark, Flat, Floating; focus, error and disabled; heights 28, 32, 36, 44, 48.
- Dev server run with `next/font` stubbed locally (sandbox has no Google Fonts); the stub was not
  committed. Production build is left to CI.

## Resolution

Input built to the Figma matrix (state, size, shape, depth). Depth `Inner` is realised as a
gradient recess rather than an inset shadow.
