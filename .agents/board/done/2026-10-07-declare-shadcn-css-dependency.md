---
id: str-declare-shadcn-css-dependency
title: Declare shadcn in apps/web so globals.css resolves in CI builds
type: bug
from: human
to: web
priority: high
status: done
assignee: web
reviewer: human
parent: none
depends_on: []
branch: agent/web/declare-shadcn-css-dependency
worktree: ../starter-worktrees/agent/ui-ux/record-figma-and-material-decisions
scope:
  - apps/web/package.json
  - bun.lock
  - .agents/board/**
allowed_shared: []
created: 2026-10-07
updated: 2026-10-07
---

## What

Add `shadcn` back to `apps/web` dependencies.

## Why / Context

`apps/web/src/app/globals.css` imports `shadcn/tailwind.css`. Commit 677120c pruned the `shadcn`
dependency from `apps/web/package.json`, so a fresh install cannot resolve it. Local machines kept
working through a stale `node_modules` symlink. CI `build` and `e2e-web` fail with
`Can't resolve 'shadcn/tailwind.css'`; the typecheck failure had hidden it until now.

## Proposal or Ask

Re-declare `shadcn` (`^4.21.0`, as before) as a dependency of `apps/web`.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** removing the shadcn CSS import (legacy components still need its variants);
that goes with the rebuild.

## Validation

- Before the change `require.resolve("shadcn/tailwind.css")` from `apps/web` fails; after, it
  resolves. `globals.css` compiles through `@tailwindcss/postcss` (286 KB).
- `bun install --frozen-lockfile` passes.
- CI `build` and `e2e-web` jobs.

## Resolution

Re-added the dependency and lockfile entries.
