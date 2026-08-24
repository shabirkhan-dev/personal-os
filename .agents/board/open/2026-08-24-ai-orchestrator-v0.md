---
id: pos-ai-orchestrator-v0
title: Build structured AI insight and chat orchestration
type: feature
from: pm
to: ai-python
priority: high
status: open
assignee: ai-python
reviewer: reviewer
parent: 2026-08-24-personal-os-intelligence.md
depends_on:
  - 2026-08-24-ai-control-plane-v0.md
branch: none
worktree: none
scope:
  - apps/ai-api/**
allowed_shared: []
created: 2026-08-24
updated: 2026-08-24
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

Open.
