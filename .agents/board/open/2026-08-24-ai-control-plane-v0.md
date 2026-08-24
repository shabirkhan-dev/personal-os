---
id: pos-ai-control-plane-v0
title: Ship the public AI gateway and context contract
type: feature
from: pm
to: backend
priority: high
status: open
assignee: backend
reviewer: reviewer
parent: 2026-08-24-personal-os-intelligence.md
depends_on:
  - 2026-08-24-ai-product-design.md
branch: none
worktree: none
scope:
  - apps/nest-api/**
  - apps/docs/content/docs/backend-api.mdx
allowed_shared: []
created: 2026-08-24
updated: 2026-08-24
---

## What

Create the NestJS public AI gateway for the read-only first wave. It authenticates the user,
resolves only authorized Personal OS context, proxies to the internal AI service, and documents
the stable client contract.

## Why / Context

Clients must never call provider APIs or receive provider keys. The current AI service is internal
and plain-assist oriented; the public product needs a session/insight boundary that web and mobile
can consume consistently.

## Proposal or Ask

Design and implement the smallest stable `/api/v1/ai` contract for:

- Daily Intelligence for the user's current day, routines, and finance summary.
- Creating a chat session and sending a context-aware read-only message.
- Context references for route, entity, date, and selected Personal OS records.
- Source references and suggested actions that are explicitly non-mutating in v0.

Own authentication, ownership checks, input bounds, rate limits, timeouts, error envelopes, and
audit-safe logging. Update `apps/docs/content/docs/backend-api.mdx` in the same commit. Do not add
mutation tools in this card.

## Definition of done

- Public endpoints have typed DTOs, authorization, bounded inputs, stable success/error envelopes,
  and focused tests for unauthorized, invalid-context, timeout, provider-error, and success paths.
- Context is minimized and user-scoped; raw tokens and unnecessary personal data never enter logs.
- `backend-api.mdx` contains exact request/response contracts and changelog entries.
- No web/mobile code is changed.

## Validation

- `bun --cwd apps/nest-api run lint`
- `bun --cwd apps/nest-api run typecheck`
- `bun --cwd apps/nest-api run test`
- Relevant integration/e2e checks and `bun run architecture:check`

## Resolution

Open.
