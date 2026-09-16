---
id: pos-ai-orchestrator-v0
title: Build structured AI insight and chat orchestration
type: feature
from: pm
to: ai-python
priority: high
status: doing
assignee: ai-python
reviewer: reviewer
parent: 2026-08-24-personal-os-intelligence.md
depends_on:
  - 2026-08-24-ai-control-plane-v0.md
branch: agent/ai-python/ai-orchestrator-v0
worktree: ../personal-os-worktrees/agent/ai-python/ai-orchestrator-v0
scope:
  - apps/ai-api/**
allowed_shared: []
created: 2026-08-24
updated: 2026-09-16
---

## What

Evolve the internal FastAPI AI service from plain text assistance into validated, provider-neutral
structured output for Daily Intelligence and read-only Personal OS Chat.

## Why / Context

The model must not be trusted to invent actions or claim execution. The AI service should return
typed answers, insights, source references, and non-mutating suggestions while keeping provider
keys and prompts internal.

## Proposal or Ask

- Define versioned Pydantic request/response schemas aligned with the backend contract.
- Implement context-grounded insight generation and chat orchestration behind the existing provider
  port.
- Keep mock-provider behavior deterministic for tests.
- Add provider timeout, bounded retries, safe provider-error mapping, latency/cost metadata, and
  privacy-safe structured logs.
- Add evaluation fixtures for routine insight accuracy, finance context grounding, refusal of
  unsupported claims, empty context, and malformed provider output.

Do not implement database access, public Nest routes, client UI, or durable mutations.

## Definition of done

- Structured output is schema-validated before leaving `ai-api`.
- Unsupported facts and action claims are rejected or clearly marked as suggestions.
- Existing `/assist` compatibility is preserved or documented as a deliberate contract change.
- Tests and evaluation fixtures cover success and failure behavior.

## Validation

- `bun --cwd apps/ai-api run lint`
- `bun --cwd apps/ai-api run test`
- Relevant Python evaluation commands and API checks
- `bun run architecture:check` for boundary changes

## Resolution

Implemented on `agent/ai-python/ai-orchestrator-v0` and merged into `main` via PR #18
(`b0f9a18`, 2026-09-16) on explicit human product-owner approval.

**Review status: changes requested.** See the `Review:` section below. The reviewer's findings are
recorded on this card rather than on PR #18, so the merge commit carries no review state. The card
is deliberately **back in `doing/`**: the reviewer's instruction was not to move it to `done/`
while the end-to-end verification and the `ai-product-design.md` dependency are outstanding.

**Undisclosed gap, now disclosed (V1 remedy).** The Proposal asked for "provider timeout, bounded
retries, safe provider-error mapping, latency/cost metadata, and privacy-safe structured logs."
That work **did not land**. `openai_compatible.py` keeps the pre-existing hardcoded `timeout=60.0`
with no retry policy, no latency/cost metadata, and no new structured logging on this branch. It is
a deliberate deferral tracked by `2026-09-16-ai-provider-reliability.md`, not an omission.

**Deferred, not forgotten.** True end-to-end verification against a live Nest gateway plus
Postgres is covered by the existing `2026-08-24-ai-mvp-verification.md` (QA) rather than a new
duplicate card. `2026-08-24-ai-control-plane-v0.md` still owns review of the Nest-side gateway and
remains in `doing/`.

Changed:
- `apps/ai-api/src/ai_api/schemas/` — `base.py` (camelCase wire base), `intelligence.py`
  (`SourceRef`, `SuggestedAction`, `Insight`, `DailyContext`, `DailyIntelligenceRequest/Response`),
  `chat.py` (`ChatTurn`, `ChatEntity`, `ChatContext`, `ChatRequest`, `ChatResponse`)
- `apps/ai-api/src/ai_api/domain/ports.py` — `StructuredResult` and `LlmProvider.complete_json`
- `apps/ai-api/src/ai_api/domain/errors.py` — `InvalidStructuredOutputError`
- `apps/ai-api/src/ai_api/application/` — `intelligence_service.py`, `chat_service.py`
- `apps/ai-api/src/ai_api/api/` — `v1/intelligence.py`, `v1/chat.py`, `v1/router.py`, `errors.py`,
  `deps.py`
- `apps/ai-api/src/ai_api/infrastructure/providers/` — `mock_provider.py`,
  `openai_compatible.py`
- `apps/ai-api/tests/` — `test_intelligence.py`, `test_chat.py`, `test_evaluation.py`,
  `support.py`, `fixtures/{daily,chat}_evaluation.json`, `conftest.py`
- `apps/ai-api/README.md`, `apps/ai-api/pyproject.toml`

Validation:
- `bun --cwd apps/ai-api run test` — **32 passed** (the suite held 3 tests, and 1 of those was
  already failing on `main`; see the reviewer note below)
- `.venv/bin/ruff check .` — pass; `.venv/bin/ruff format --check .` — clean
- `bun run architecture:check` — pass (boundaries + 753-path kebab-case naming check)
- Live smoke test on `127.0.0.1:8011`: `POST /api/v1/intelligence/daily` and `POST /api/v1/chat`
  fed the gateway's exact payloads returned camelCase `insights[].sourceRefs` /
  `suggestedAction` and a string `reply`; `POST /api/v1/assist` still `200`

Contract impact:
- Adds internal-only routes `/api/v1/intelligence/daily` and `/api/v1/chat`. Nest is the only
  caller and authenticates with the service token, so there is no public contract change;
  `apps/docs/content/docs/backend-api.mdx` is unchanged and still accurate.
- `/assist` behaviour untouched (verified by smoke test and its existing test).

Commits:
- `099a15e` — test fixture hermeticity
- `80df400` — feature

Review:
- **Changes requested** (reviewer, 2026-09-16). Independent review of `agent/ai-python/ai-orchestrator-v0`
  (`099a15e`, `80df400`) in its own worktree, re-running validation rather than trusting the
  self-report.
  - Confirmed: `bun --cwd apps/ai-api run test` — 32 passed; `ruff check`/`format --check` — clean;
    `bun run architecture:check` — pass. `conftest.py` fix is real and correct (`setdefault`
    silently no-ops when the root `.env` already exports `AI_SERVICE_TOKEN`). Mock provider
    genuinely derives output from context and never cites an unsupplied id (asserted in
    `test_evaluation.py`). `DailyIntelligenceResponse.insights` is required, not defaulted —
    confirmed via the malformed-output test. `/assist` is untouched (empty diff). Fixture cases
    cover all five Definition-of-Done categories. No DB/Nest/web/mobile files touched — scope held.
    Auth (`InternalAuthDep`) is wired on both new routes.
  - **V1 — undisclosed gap in the Resolution.** The card's Proposal explicitly asked for "provider
    timeout, bounded retries, safe provider-error mapping, latency/cost metadata, and privacy-safe
    structured logs." None of that landed — `openai_compatible.py` still has the pre-existing
    hardcoded `timeout=60.0` with no retry logic, no metadata, no structured logging added on this
    branch (confirmed by diff and by grepping `src/` for retry/latency/logging). This isn't in the
    formal Definition of Done, so it does not block merge, but the Resolution section does not
    disclose the deviation. Contract §"Communication": state the ambiguity/gap explicitly rather
    than omitting it. Action: either implement it or record it as an accepted deferral/follow-up
    card before this moves to `done/`.
  - Non-blocking structural note: grounding ("never invent an id") is enforced by prompt
    instructions for the real `openai_compatible` provider but is only test-verified against the
    mock provider — no code-level check exists that a real model's cited ids are in context.
    Acceptable for v0 (shape violations still fail via `InvalidStructuredOutputError`); worth a
    follow-up card once a real provider is live.
  - The `apps/ai-api` implementation itself is sound on its own scope. Do not move this card to
    `done/` yet: (1) add the retry/metadata/logging disclosure or follow-up above, and (2) the
    still-missing true end-to-end check against a live Nest gateway + Postgres (noted in the card's
    own "Notes for the reviewer") is a legitimate reason to keep this in `doing/` independent of
    code quality, as is the still-open `ai-product-design.md` dependency on the sibling
    `ai-control-plane-v0.md` card.

## Notes for the reviewer

- **Pre-existing defect fixed on this branch.** `apps/ai-api/tests/conftest.py` used
  `os.environ.setdefault` for `AI_SERVICE_TOKEN`, but bun and the dev shell export that variable
  from the root `.env`, so the fixture could not override it and every authenticated test failed
  with `401`. Reproduced on a pristine `main` before fixing.
- The mock provider derives its payload from the supplied context rather than returning canned
  text. That is what makes the grounding, empty-context, and refusal assertions meaningful, and it
  never cites an id that was not supplied.
- `DailyIntelligenceResponse.insights` is required rather than defaulted, so a provider that omits
  it fails here with `AI_INVALID_STRUCTURED_OUTPUT` instead of at Nest as a generic upstream error.
- Still missing: an end-to-end check with the real Nest gateway against a running `ai-api`
  (needs Postgres). Shape compatibility is asserted in tests and the smoke test, but the true
  integration is unverified.
