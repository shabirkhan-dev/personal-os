---
id: str-rabtx-textarea
title: Build the Rabtx Textarea and its docs page
type: feature
from: human
to: ui-ux
priority: high
status: done
assignee: ui-ux
reviewer: human
parent: str-rabtx-field
depends_on: []
branch: agent/ui-ux/rabtx-textarea
worktree: ../starter-worktrees/agent/ui-ux/rabtx-textarea
scope:
  - packages/rabtx/**
  - apps/web/src/app/ui/**
  - apps/web/e2e/ui-textarea.spec.ts
  - DESIGN.md
  - .agents/board/**
allowed_shared:
  - apps/web/**
  - DESIGN.md
created: 2026-10-08
updated: 2026-10-08
---

## What

The fourth `@rabtx/ui` component, Textarea (Figma `66:783`), with a docs page at `/ui/textarea`.

## Why / Context

Owner: next component. It also proves Field's context works for a second control.

## Proposal or Ask

- The textarea element is the field: `rx-control rx-field` directly, no wrapper, so the native
  resize grip stays in the real corner and there is no pointer redirect to maintain.
- `rx-field` now also matches `[aria-invalid="true"]` on the element itself.
- Input's error halo corrected to Figma's measured strength (10%).

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** auto-grow (`field-sizing` is not yet in every browser), character counter, Select,
Checkbox, Solid and native versions.

## Validation

- `bun run lint`, `typecheck`, `naming:check`, `architecture:check`, `format` pass.
- `ui-textarea.spec.ts` (5), `ui-field.spec.ts` (3), `ui-input.spec.ts` (5), `ui-button.spec.ts` (5)
  and the home spec pass against the dev server (19 tests).
- Checked in Chromium: light, dark, focus, error, disabled, Flat and Floating.
- Dev server run with `next/font` stubbed locally; the stub was not committed.

## Resolution

Textarea built. Figma draws it differently from Input; it follows Input (flagged in DESIGN.md).
