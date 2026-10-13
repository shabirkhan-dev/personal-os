---
id: str-remove-old-playgrounds
title: Delete the old playgrounds so the new /ui playground starts fresh
type: chore
from: human
to: ui-ux
priority: high
status: done
assignee: ui-ux
reviewer: human
parent: str-record-figma-and-material-decisions
depends_on: []
branch: agent/ui-ux/remove-old-playgrounds
worktree: ../starter-worktrees/agent/ui-ux/record-figma-and-material-decisions
scope:
  - apps/web/src/app/ui/**
  - apps/web/src/modules/ui/**
  - apps/docs/src/app/rabtx/**
  - apps/docs/content/rabtx/**
  - apps/docs/src/components/preview.tsx
  - apps/docs/src/lib/source.ts
  - apps/docs/source.config.ts
  - apps/docs/src/lib/layout.shared.tsx
  - apps/docs/src/app/global.css
  - apps/docs/package.json
  - bun.lock
  - README.md
  - .agents/ownership.yaml
  - .agents/roles/ui-ux.md
  - .agents/board/**
allowed_shared:
  - apps/docs/**
  - apps/web/**
  - .agents/ownership.yaml
  - .agents/roles/ui-ux.md
created: 2026-10-07
updated: 2026-10-07
---

## What

Delete both existing playgrounds: the web `/ui` lab (and `modules/ui`) and the docs `/rabtx` pages.

## Why / Context

Owner decision (2026-10-07): start the playground fresh, rebuilt inside `apps/web` at `/ui`, and
build `@rabtx/ui` one component at a time. The old lab showcased the legacy shadcn and `motion`
components; the docs pages showed the verbatim shadcn Button. Nothing else referenced either.

## Proposal or Ask

Remove the routes, components and docs content, unwire them from the docs app (collection, loader,
nav link, `@rabtx/ui` dependency, `@source` line), update README, and point the UI/UX ownership at
the new playground path. The new `/ui` is built in the next card.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:**

- Building the new playground or the Button.
- Removing `@starter/ui` components that only the old lab used (they stay until replaced).
- Dependencies of `apps/web` that were already unused (`clsx`, `tailwind-merge`).

## Validation

- `bun install --frozen-lockfile` passes.
- `bun run lint`, `bun run typecheck`, `bun run naming:check`, `bun run architecture:check` pass.
- CI build job for web and docs.

## Resolution

Deleted the two playgrounds and their wiring; docs now serve `/docs` only. `/ui` returns 404 until
the next card rebuilds it.
