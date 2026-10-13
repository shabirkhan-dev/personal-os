---
id: str-rabtx-badge
title: Build the Rabtx Badge and its docs page
type: feature
from: human
to: ui-ux
priority: high
status: done
assignee: ui-ux
reviewer: human
parent: str-rabtx-card
depends_on: []
branch: agent/ui-ux/rabtx-badge
worktree: ../starter-worktrees/agent/ui-ux/rabtx-badge
scope:
  - packages/rabtx/**
  - apps/web/src/app/ui/**
  - apps/web/e2e/ui-badge.spec.ts
  - DESIGN.md
  - .agents/board/**
allowed_shared:
  - apps/web/**
  - DESIGN.md
created: 2026-10-08
updated: 2026-10-08
---

## What

Badge (Figma `6:116`), a short status label, with a docs page at `/ui/badge`.

## Why / Context

Owner: next component after Card. Cards and blocks need status labels.

## Proposal or Ask

- Server-safe `Badge` (no hooks), `tone` and `dot`; `badge.styles.ts` has the class strings.
- `rx-tint` derives fill and ink from one `--tone`; new status tokens and a `--rx-r-badge` tier.
- Ink is darkened (lightened in dark) to pass 4.5:1; Figma's raw colors do not.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** Tag (outlined), Chip (interactive), Status Icon, Solid and native versions.

## Validation

- `bun run lint`, `typecheck`, `naming:check`, `architecture:check`, `format` pass.
- 27 Playwright tests pass against the dev server (badge 4, card 4, button 5, input 5, textarea 5,
  field 3, home 1). The badge spec computes WCAG contrast for every tone in light and dark.
- Measured contrast: light 4.86 to 6.8, dark 5.07 to 6.6 (the 75% ink mix was chosen from a sweep as
  the lightest that passes with margin).
- Dev server run with `next/font` stubbed locally; the stub was not committed.

## Resolution

Badge built. Dark values for success, warning and violet are derived (the same base colors), since
Figma has no dark status colors.
