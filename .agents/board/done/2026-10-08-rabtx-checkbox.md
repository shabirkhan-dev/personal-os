---
id: str-rabtx-checkbox
title: Build the Rabtx Checkbox and its docs page
type: feature
from: human
to: ui-ux
priority: high
status: done
assignee: ui-ux
reviewer: human
parent: str-rabtx-select
depends_on: []
branch: agent/ui-ux/rabtx-checkbox
worktree: ../starter-worktrees/agent/ui-ux/rabtx-checkbox
scope:
  - packages/rabtx/**
  - apps/web/src/app/ui/**
  - apps/web/e2e/ui-checkbox.spec.ts
  - DESIGN.md
  - .agents/board/**
allowed_shared:
  - apps/web/**
  - DESIGN.md
created: 2026-10-08
updated: 2026-10-08
---

## What

Checkbox (Figma `6:59`), with a docs page at `/ui/checkbox`.

## Why / Context

Owner: Checkbox next. The platform-first approach again: a real checkbox gives keyboard, forms and
screen reader behavior for free.

## Proposal or Ask

- Native checkbox, `appearance: none`; colors, tick, minus and hit area in `checkbox.css`.
- `mixed` prop (sets `indeterminate`); children render a wrapping `<label>`.
- New `--rx-r-check` radius tier (4, 2, and 6 in Round so it never becomes a circle).

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** Radio, Toggle (switch), Task Check, checkbox groups, Solid and native versions.

## Validation

- `bun run lint`, `typecheck`, `naming:check`, `architecture:check`, `format` pass.
- 40 Playwright tests pass against the dev server (checkbox 7, select 6, badge 4, card 4, button 5,
  input 5, textarea 5, field 3, home 1): label click and Space toggle, 16px accent and white boxes, a
  24px hit area, disabled, select-all mixed cycle, 2px focus ring, radius in all modes.
- Checked in Chromium at 3x: light, dark, tick, minus, disabled.
- Dev server run with `next/font` stubbed locally; the stub was not committed.

## Resolution

Checkbox built. Not verified: Safari and Firefox (pseudo-elements on a checkbox with
`appearance: none`).
