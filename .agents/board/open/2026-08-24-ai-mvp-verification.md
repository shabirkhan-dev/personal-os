---
id: pos-ai-mvp-verification
title: Verify Personal OS Intelligence MVP
type: feature
from: pm
to: qa
priority: high
status: open
assignee: qa
reviewer: reviewer
parent: 2026-08-24-personal-os-intelligence.md
depends_on:
  - 2026-08-24-ai-control-plane-v0.md
  - 2026-08-24-ai-orchestrator-v0.md
  - 2026-08-24-web-ai-command-center.md
  - 2026-08-24-mobile-ai-command-center.md
branch: none
worktree: none
scope: []
allowed_shared: []
created: 2026-08-24
updated: 2026-08-24
---

## What

Independently verify the end-to-end Daily Intelligence + Personal OS Chat v0 across API, web, and
mobile. QA is read-only and raises defect cards for owning roles.

## Definition of done

- Verify authorized user isolation and confirm no provider key reaches clients or logs.
- Verify routine/finance context grounding, source references, unsupported-question behavior, and
  no silent mutations.
- Verify loading, empty, timeout, provider failure, retry, logout, expired session, offline/mobile
  resume, narrow-screen, keyboard, accessibility, and reduced-motion behavior.
- Run browser and device/simulator checks and record screenshots/evidence where useful.
- Raise one card per reproducible defect with severity, owner, expected, actual, and reproduction.

## Validation

- All child-card commands.
- `bun run architecture:check`
- Browser verification and supported mobile device/simulator verification.

## Resolution

Open.
