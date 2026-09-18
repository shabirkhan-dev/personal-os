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
branch: none
worktree: none
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
- **Changes requested** (reviewer, 2026-09-16). Independent review of `2c77cf0`, re-running the
  checks rather than trusting the self-report. Independence caveat stated plainly: the reviewer
  performed the `2862675` → `2c77cf0` cherry-pick as the PM integration step, so it reviewed code
  it did not author but did integrate. A backend-side reviewer should confirm the findings below.
  - Confirmed: `bun run typecheck` — pass; `bun run test` — nest-api **69/70**, and the single
    failure is a pre-existing environment defect, not this change (see F4);
    `bun run architecture:check` — pass. `JwtAuthGuard` is on the controller class;
    `ParseUUIDPipe` on `sessionId`; the global `ZodValidationPipe` (`app.setup.ts:52`, wired via
    `setupApp` in `main.ts`) validates `CreateChatSessionDto`, `SendMessageDto`, and the pagination
    query DTOs, so inputs are bounded. `AI_SESSION_MESSAGE_LIMIT`, ownership on every
    session/message read (`findSession`/`listMessages` filter on `userId`), and the per-request
    `fetchWithTimeout(...externalRequestTimeoutMs)` all hold. `backend-api.mdx` documents the
    endpoints, rules, rate limits, and all four upstream error codes in the same commit.
  - **F1 — Definition-of-done gap (V1).** The DoD requires "focused tests for unauthorized,
    invalid-context, timeout, provider-error, and success paths." Only success, session-ownership,
    and message-limit paths are covered (7 cases in `ai-gateway.service.spec.ts`). There is **no**
    `ai.client.spec.ts`, and the four codes it emits — `AI_UNAVAILABLE`, `AI_UPSTREAM_ERROR`,
    `AI_INVALID_INSIGHT_RESPONSE`, `AI_INVALID_CHAT_RESPONSE` — appear in **zero** test files
    (`grep -rl <code> apps/nest-api/src --include=*.spec.ts` → 0 for each). Timeout, provider
    failure, malformed upstream payload, and the unauthorized path are documented but unverified.
  - **F2 — context entity is accepted unverified (V1–V2).** `chatContextSchema`
    (`ai-gateway.dto.ts:5-11`) accepts any `z.uuid()` for `entity.id`, and the service forwards it
    upstream (`ai-gateway.service.ts:60`, `:182`) without ever resolving it or checking that the
    caller owns that record. The card's DoD says context is "minimized and user-scoped", and
    `backend-api.mdx` states "Ownership is enforced everywhere". Neither is true for this field.
    Impact is bounded — `ai-api` has no database access, so no other user's data is disclosed —
    but a client can push an arbitrary uuid into the model prompt and have it echoed back in
    `sourceRefs`, and source references are the feature's whole provenance story. Action: resolve
    the entity against the owning service before forwarding, or drop `entity` from the accepted
    context until it can be verified.
  - **F3 — upstream error cause is discarded (low).** `ai.client.ts` logs only the HTTP status
    (`this.logger.warn(...returned ${response.status})`) and flattens every non-ok response to
    `AI_UPSTREAM_ERROR`. A malformed-provider-JSON failure and a provider outage are therefore
    indistinguishable in logs. Carrying the upstream envelope's `code` into the log line would fix
    it. The Nest-side counterpart of the ai-api logging work tracked separately.
  - **F4 — pre-existing env-dependent test failure (not this card).** `bun run test` fails 1 test on
    a dev workstation: `auth.service.spec.ts:91` expects `developmentCode`, which `AuthService`
    only sets when `config.exposeAuthCodes` is true (`auth.service.ts:505`),
    `!isProduction && authDevExposeCodes` (`app-config.service.ts:93-95`). The dev shell exports
    `AUTH_DEV_EXPOSE_CODES=false` from the root `.env`, `apps/nest-api/.env` sets `true`, and
    vitest loads neither. Reproduced independently: `env -u AUTH_DEV_EXPOSE_CODES bunx vitest run
    ...auth.service.spec.ts` → 3/3 pass. Same defect class as the ai-api `AI_SERVICE_TOKEN` bug.
    Raised as `2026-09-16-nest-test-env-hermeticity.md`; do not attribute it to this card.
    **Resolved** by that card — fixed in `f7676a6` (merged 2026-09-17), suite now 70/70 on a
    plain dev shell; that card is in `done/`.
  - Verified as **not** defects: `listSessions`/`listMessages` are validated by the global pipe
    (initially suspected unvalidated, disproved by `app.setup.ts:52`); `/ai/chat/sessions`
    pagination bounds via `makePaginationSchema`; the structured paths deliberately omit
    `X-User-Id` that `/assist` sends, which is context minimization rather than a regression.
  - This card also still owes its declared `depends_on: 2026-08-24-ai-product-design.md`, which
    remains open. Stays in `doing/`.

## Blocking gap (resolved 2026-09-16)

The gateway calls `POST /api/v1/intelligence/daily` and `POST /api/v1/chat` on the internal AI
service (`apps/nest-api/src/modules/ai/ai.client.ts`), but `apps/ai-api` originally mounted only
`/api/v1/assist` and `/api/v1/health`. Both structured paths therefore returned 502
`AI_UPSTREAM_ERROR` outside of stubbed tests: the gateway failed safely, but it was not functional
end-to-end.

**Resolved.** `2026-08-24-ai-orchestrator-v0.md` implemented both endpoints and they are now in
`main` (merge commit `b0f9a18`), so this gateway has a real upstream. See that card for the
endpoint contract and its own outstanding review.

Still outstanding before this card closes: independent review of the gateway commits, and the
declared `depends_on: 2026-08-24-ai-product-design.md` remains open.
