---
id: pos-web-ai-command-center
title: Implement web Daily Intelligence and Chat v0
type: feature
from: pm
to: web
priority: high
status: open
assignee: web
reviewer: reviewer
parent: 2026-08-24-personal-os-intelligence.md
depends_on:
  - 2026-08-24-ai-product-design.md
  - 2026-08-24-ai-control-plane-v0.md
  - 2026-08-24-ai-orchestrator-v0.md
branch: none
worktree: none
scope:
  - apps/web/**
allowed_shared: []
created: 2026-08-24
updated: 2026-08-24
---

## What

Build the responsive web Daily Intelligence surface and context-aware Personal OS Chat v0 using
only the documented NestJS contract.

## Why / Context

Chat is a command center for the user's Personal OS, not a generic blank chat page. The first wave
must make the daily loop useful while remaining read-only and truthful.

## Proposal or Ask

- Add Daily Intelligence cards to the appropriate today surface.
- Add a chat route/panel with message history, context chips, current screen/entity/date context,
  streaming or clearly staged loading, retry, empty, unauthorized, and provider-error states.
- Render source references and suggested actions as non-mutating guidance.
- Preserve keyboard navigation, responsive layouts, focus order, reduced motion, and accessible
  labels.
- Use the existing shared UI primitives and design tokens.

Do not add mutation tools, provider calls, API contracts, or shared-package redesigns.

## Definition of done

- A user can open Daily Intelligence, inspect why an insight exists, and open Chat with context.
- Refresh, logout, API timeout, empty data, and provider failure are handled visibly.
- Browser verification and focused tests cover the interactive chat flow.
- Changed API assumptions are linked to `backend-api.mdx`, not duplicated in code comments.

## Validation

- Read `apps/docs/content/docs/backend-api.mdx` and relevant Next.js docs first.
- `bun --cwd apps/web run lint`
- `bun --cwd apps/web run typecheck`
- `bun --cwd apps/web run test`
- `bun run test:e2e:web` and browser verification for chat interactions

## Resolution

Open.
