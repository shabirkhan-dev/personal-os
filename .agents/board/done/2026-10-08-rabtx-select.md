---
id: str-rabtx-select
title: Build the Rabtx Select and its docs page
type: feature
from: human
to: ui-ux
priority: high
status: done
assignee: ui-ux
reviewer: human
parent: str-rabtx-badge
depends_on: []
branch: agent/ui-ux/rabtx-select
worktree: ../starter-worktrees/agent/ui-ux/rabtx-select
scope:
  - packages/rabtx/**
  - apps/web/src/app/ui/**
  - apps/web/e2e/ui-select.spec.ts
  - DESIGN.md
  - .agents/board/**
allowed_shared:
  - apps/web/**
  - DESIGN.md
created: 2026-10-08
updated: 2026-10-08
---

## What

Select (Figma `66:770`), the dropdown trigger, with a docs page at `/ui/select`. The list follows
Menu and Menu Item.

## Why / Context

Owner: Select next. It is the platform-first test case: the owner chose native HTML and CSS over
popover libraries, and a customizable `<select>` gives the list, keyboard, typeahead and mobile
pickers with no JavaScript.

## Proposal or Ask

- Native `<select>` inside a field wrapper; `size`, `leadingIcon`, `placeholder`; reads Field's context.
- `select.css`: `@supports (appearance: base-select)` styles the list as Menu; no effect elsewhere.
- Chevron inlined from HugeIcons (MIT) so the package needs no icon set.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** Menu as a standalone component, multi-select, searchable select (combobox),
Solid and native versions.

## Validation

- `bun run lint`, `typecheck`, `naming:check`, `architecture:check`, `format` pass.
- 33 Playwright tests pass against the dev server (select 6, badge 4, card 4, button 5, input 5,
  textarea 5, field 3, home 1). The select spec opens the real list, measures 28px rows and closes
  it with Escape.
- Production CSS: Tailwind plus Lightning CSS minification run directly on the real stylesheet; every
  new rule survives and `@starting-style` is hoisted correctly. (`next build` cannot run offline.)
- Checked in Chromium: light, dark, open list, keyboard highlight, error, disabled.
- Dev server run with `next/font` stubbed locally; the stub was not committed.

## Resolution

Select built. Not verified: Safari and Firefox (they use the OS list; the closed field is plain CSS).
