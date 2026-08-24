---
id: pos-mobile-ai-command-center
title: Implement mobile Daily Intelligence and Chat v0
type: feature
from: pm
to: mobile
priority: high
status: open
assignee: mobile
reviewer: reviewer
parent: 2026-08-24-personal-os-intelligence.md
depends_on:
  - 2026-08-24-ai-product-design.md
  - 2026-08-24-ai-control-plane-v0.md
  - 2026-08-24-ai-orchestrator-v0.md
branch: none
worktree: none
scope:
  - apps/mobile/**
allowed_shared: []
created: 2026-08-24
updated: 2026-08-24
---

## What

Build the native mobile Daily Intelligence surface and context-aware Personal OS Chat v0 using
only the documented NestJS contract.

## Why / Context

Mobile is the primary daily logging surface. The AI should be available inside the daily workflow,
understand the current route/entity/date, and remain useful on small screens without becoming a
full-screen generic chatbot.

## Proposal or Ask

- Add Daily Intelligence to the appropriate today/dashboard surface.
- Add a native chat route/sheet with message history, context chips, keyboard-safe layout, current
  screen/entity/date context, retry/error/empty/offline states, and accessible controls.
- Render source references and suggested actions as non-mutating guidance.
- Use Expo Router, safe-area-context, existing UI primitives, and semantic Uniwind/Tailwind tokens.
- Preserve the module bottom navigation and session/user isolation.

Do not add mutation tools, provider calls, API contracts, or a second theme/design system.

## Definition of done

- A user can open Daily Intelligence, inspect the insight source, and open Chat with context.
- Keyboard, resume, logout, unauthorized, timeout, empty-data, and offline states are truthful.
- No no-op controls, fake success states, hardcoded provider colors, or cross-user cache leakage.
- Device/simulator verification covers the primary chat flow and narrow-screen layout.

## Validation

- Read `apps/docs/content/docs/backend-api.mdx` and the Expo mobile skill first.
- `bun --cwd apps/mobile run lint`
- `bun --cwd apps/mobile run typecheck`
- `bun --cwd apps/mobile run test`
- Relevant Expo/device validation and screenshots

## Resolution

Open.
