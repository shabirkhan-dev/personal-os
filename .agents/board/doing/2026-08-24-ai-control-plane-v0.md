---
id: pos-ai-control-plane-v0
title: Ship the public AI gateway and context contract
type: feature
from: pm
to: backend
priority: high
status: doing
assignee: backend
reviewer: reviewer
parent: 2026-08-24-personal-os-intelligence.md
depends_on:
  - 2026-08-24-ai-product-design.md
branch: agent/backend-product/ai-control-plane
worktree: ../personal-os-worktrees/agent/backend-product/ai-control-plane
scope:
  - apps/nest-api/**
  - apps/docs/content/docs/backend-api.mdx
allowed_shared: []
created: 2026-08-24
updated: 2026-09-16
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

Backend implementation landed on `main` and is documented. **Not closed — independent review
pending and one upstream dependency is missing.**

Changed:
- `apps/nest-api/src/modules/ai/` — `ai-gateway.controller.ts`, `ai-gateway.service.ts`,
  `ai-gateway.dto.ts`, `ai-gateway.repository.ts`, `ai-upstream.types.ts`, `ai.client.ts`,
  `ai.module.ts`
- `apps/nest-api/src/database/schema/ai-chat.schema.ts` and `schema/index.ts`
- `apps/nest-api/drizzle/migrations/0007_third_johnny_storm.sql` — `ai_chat_sessions`,
  `ai_chat_messages`
- `apps/docs/content/docs/backend-api.mdx` — readiness row, `/ai` contract section,
  `2026-08-25` changelog entry

Validation:
- `bun run typecheck` — pass (5/5 packages)
- `bun run test` — pass; nest-api 70 tests including `ai-gateway.service.spec.ts` (7 cases:
  daily-intelligence grounding, session create, conversation persistence, context-free chat
  grounding, per-message context override, message limit, cross-user rejection)
- `bun run architecture:check` — pass (boundaries + kebab-case naming, 753 paths)

Contract impact:
- `apps/docs/content/docs/backend-api.mdx` now documents `GET /ai/daily`,
  `POST|GET /ai/chat/sessions`, `GET|POST /ai/chat/sessions/:sessionId/messages`, rate limits, and
  error codes. No BREAKING change to existing endpoints.

Commits:
- `2c77cf0` — integration on `main` (cherry-pick of `2862675` from branch
  `agent/backend-product/ai-control-plane`)

Review:
- Pending. `reviewer: reviewer` — the implementation owner must not self-approve.

## Blocking gap

The gateway calls `POST /api/v1/intelligence/daily` and `POST /api/v1/chat` on the internal AI
service (`apps/nest-api/src/modules/ai/ai.client.ts`), but `apps/ai-api` mounts only
`/api/v1/assist` and `/api/v1/health`. No upstream handler exists, so both structured paths return
502 `AI_UPSTREAM_ERROR` outside of stubbed tests — the gateway fails safely, but it is not
functional end-to-end.

`2026-08-24-ai-orchestrator-v0.md` (ai-python) must land before this card is genuinely done.
The declared `depends_on: 2026-08-24-ai-product-design.md` is also still open.
