---
id: str-rabtx-docs-style-ui
title: Replace the playground with docs-style pages and slim the Button to Tailwind
type: refactor
from: human
to: ui-ux
priority: high
status: done
assignee: ui-ux
reviewer: human
parent: str-rabtx-button-and-playground
depends_on: []
branch: agent/ui-ux/rabtx-docs-style-ui
worktree: ../starter-worktrees/agent/ui-ux/rabtx-docs-style-ui
scope:
  - packages/rabtx/**
  - apps/web/src/app/ui/**
  - apps/web/e2e/ui-button.spec.ts
  - DESIGN.md
  - .agents/board/**
allowed_shared:
  - apps/web/**
  - DESIGN.md
created: 2026-10-08
updated: 2026-10-08
---

## What

Owner feedback on the first playground: too many examples, wants documentation like shadcn or beUI,
Tailwind used as much as possible, minimal code, and Solid support planned.

## Proposal or Ask

- `/ui` becomes docs: Introduction and Button, with five examples, an API table and accessibility.
- Button styling moves to Tailwind class strings plus a few `@utility` rules, shared by every
  framework wrapper. `button.css` (330 lines) is replaced by `control.css` (125) and
  `button.styles.ts` (39); `button.tsx` shrinks from 99 to 78 lines.
- The web docs code goes from about 1,200 lines to about 400, including a 5-test e2e spec.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** the Solid and native Buttons (the shared class strings are the preparation), other
components, Figma dark values.

## Validation

- `bun run lint`, `typecheck`, `naming:check`, `architecture:check`, `format` pass.
- `apps/web/e2e/ui-button.spec.ts`: 5 Playwright tests pass against the dev server.
- Checked in Chromium: light, dark, Flat, Floating, Round; loading shows the spinner and holds
  width; focus ring; no horizontal scroll at 375px.
- The dev server was run with `next/font` stubbed locally because the sandbox cannot reach Google
  Fonts; the stub was not committed. The production build of `web` is left to CI.

## Resolution

Docs-style pages and the Tailwind Button are in. The Flat hover edge now follows the fill by
construction (`--rx-flat: var(--rx-fill)`), which removes the earlier special case.
