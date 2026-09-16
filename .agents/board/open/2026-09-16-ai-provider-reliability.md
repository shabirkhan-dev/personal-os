---
id: pos-ai-provider-reliability
title: Provider timeout, retry, metadata, and privacy-safe logging for ai-api
type: feature
from: reviewer
to: ai-python
priority: normal
status: open
assignee: none
reviewer: reviewer
parent: 2026-08-24-personal-os-intelligence.md
depends_on: []
branch: none
worktree: none
scope:
  - apps/ai-api/**
allowed_shared: []
created: 2026-09-16
updated: 2026-09-16
---

## What

Deliver the provider-reliability requirements the `ai-orchestrator-v0` Proposal asked for but which
did not land with that card: configurable timeouts, a bounded and explicitly safe retry policy,
latency/cost metadata, and privacy-safe structured logging.

## Why / Context

Raised as the V1 remedy from the `2026-08-24-ai-orchestrator-v0.md` review. The orchestrator card
shipped `/api/v1/intelligence/daily` and `/api/v1/chat` correctly, but its Proposal also promised:

> "Add provider timeout, bounded retries, safe provider-error mapping, latency/cost metadata, and
> privacy-safe structured logs."

`openai_compatible.py` still hardcodes `timeout=60.0` on a per-request `httpx.AsyncClient`, has no
retry logic, returns no latency/cost metadata, and adds no structured logging. The orchestrator card
was merged without disclosing this deviation; this card makes the deferral explicit and actionable.

Related: the Nest layer already bounds its own upstream calls
(`apps/nest-api/src/common/http/fetch-with-timeout.ts`, see the closed
`2026-08-24-backend-upstream-timeouts.md`). The Python service has no equivalent, so a stalled
provider in `ai-api` is only bounded indirectly by the caller's timeout.

## Proposal or Ask

- Replace the hardcoded timeout with a setting (e.g. `AI_REQUEST_TIMEOUT_SECONDS`, bounded range)
  applied to provider calls.
- Add a bounded retry policy only for idempotent generation calls, with explicit backoff and a
  documented decision not to retry when the provider may have already billed or partially streamed.
- Extend the structured result/response metadata with latency (and token/cost where the provider
  reports it), without leaking prompts or user content.
- Add privacy-safe structured logging: provider name, model, task, latency, outcome, error code.
  Never log prompt bodies, message content, or provider keys.
- Add a code-level check that cited source ids exist in the supplied context, so grounding is
  enforced for real providers rather than only asserted against the mock (reviewer's structural
  note).

## Definition of done

- A hung provider cannot exceed the configured deadline.
- Retries are bounded, documented, and never blind.
- Latency/cost metadata is available to callers.
- Logs are structured and contain no prompt or user content.
- A non-mock provider cannot return a source id that was not in its context.

## Scope

**In scope:**

- `apps/ai-api/**`

**Out of scope:**

- Nest-side timeout handling (already delivered on the backend card)
- Public contract changes in `apps/docs/content/docs/backend-api.mdx` (backend-owned)
- Adding a real provider key or live provider calls in CI

## Validation

- `bun --cwd apps/ai-api run lint`
- `bun --cwd apps/ai-api run test`
- New tests for timeout, retry bounds, non-retry on unsafe operations, and grounding rejection
- `bun run architecture:check` for boundary changes

## Resolution

Open. Raised by the reviewer during `2026-08-24-ai-orchestrator-v0.md` review; not yet claimed.
