---
id: str-rabtx-field
title: Build the Rabtx Field and its docs page
type: feature
from: human
to: ui-ux
priority: high
status: done
assignee: ui-ux
reviewer: human
parent: str-rabtx-input
depends_on: []
branch: agent/ui-ux/rabtx-field
worktree: ../starter-worktrees/agent/ui-ux/rabtx-field
scope:
  - packages/rabtx/**
  - apps/web/src/app/ui/**
  - apps/web/e2e/ui-field.spec.ts
  - DESIGN.md
  - .agents/board/**
allowed_shared:
  - apps/web/**
  - DESIGN.md
created: 2026-10-08
updated: 2026-10-08
---

## What

The third `@rabtx/ui` component, Field (label, control, hint or error), with a docs page at `/ui/field`.

## Why / Context

Owner: continue one component at a time. Input's docs asked people to wire labels by hand; Field does
it once (Figma `26:436`).

## Proposal or Ask

- `Field` generates an id and provides it, the described-by id and the invalid state through a
  context; `Input` reads it. The message is a polite live region.
- `field.styles.ts` holds the class strings with no framework code.
- The Input docs example now uses Field.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** Textarea, Select, Checkbox (they will read the same context), required markers,
Solid and native versions.

## Validation

- `bun run lint`, `typecheck`, `naming:check`, `architecture:check`, `format` pass.
- `ui-field.spec.ts` (3), `ui-input.spec.ts` (5) and `ui-button.spec.ts` (5) pass against the dev server.
- Checked in Chromium: hint, error, label click focus, accessible description, distinct ids.
- Dev server run with `next/font` stubbed locally; the stub was not committed.

## Resolution

Field built. Found and fixed two issues on the way: the context must not be exported publicly (a
server component importing it failed), and an example file cannot be named `error.tsx` because Next
reserves that name for error boundaries.
