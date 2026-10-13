---
id: str-rabtx-card
title: Build the Rabtx Card and its docs page
type: feature
from: human
to: ui-ux
priority: high
status: done
assignee: ui-ux
reviewer: human
parent: str-rabtx-textarea
depends_on: []
branch: agent/ui-ux/rabtx-card
worktree: ../starter-worktrees/agent/ui-ux/rabtx-card
scope:
  - packages/rabtx/**
  - apps/web/src/app/ui/**
  - apps/web/e2e/ui-card.spec.ts
  - DESIGN.md
  - .agents/board/**
allowed_shared:
  - apps/web/**
  - DESIGN.md
created: 2026-10-08
updated: 2026-10-08
---

## What

A minimal Card, the container blocks are composed from, with a docs page at `/ui/card`.

## Why / Context

Owner: build Card next, minimal, so blocks can start. Figma has no generic Card; the shared shape
comes from the Kanban, Option and Stat cards and the Shape and Depth section (`55:502`).

## Proposal or Ask

- `Card` (no client code), `padding` sm, md, lg, `as` for the element, `cardParts` text styles.
- `rx-surface` split out of `rx-control`; new `rx-card` tone; the flat and motion-off rules cover it.
- Docs `Example` gained `muted` (a tinted stage) because cards sit on a gray page.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** Option Card, Stat Card, Plan Card (separate Figma components), card header and
footer parts, clickable cards, Solid and native versions.

## Validation

- `bun run lint`, `typecheck`, `naming:check`, `architecture:check`, `format` pass.
- 23 Playwright tests pass against the dev server (card 4, button 5, input 5, textarea 5, field 3,
  home 1), which also covers the `rx-surface` refactor: Button, Input and Textarea are unchanged.
- Checked in Chromium: Floating, Flat, Round, dark.
- Dev server run with `next/font` stubbed locally; the stub was not committed.

## Resolution

Card built. Padding offsets, the three radius modes, Flat vs Floating and "no hover or press
reaction" are tested.
