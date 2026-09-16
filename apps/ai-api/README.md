# AI API (`apps/ai-api`)

Python **FastAPI** service for in-app AI assistance. Managed with **[uv](https://docs.astral.sh/uv/)**.

## Architecture

```txt
Web / Mobile  →  NestJS (auth, tenancy, audit)  →  ai-api (prompts + models)
```

- FastAPI does **not** own auth sessions, billing, or domain CRUD.
- Nest authenticates the user, then calls ai-api with a shared service token.
- Model providers are behind a port (`LlmProvider`) so mock and OpenAI-compatible backends swap cleanly.

## Layout

```txt
src/ai_api/
  api/                 # HTTP routers + deps
  application/         # use-cases
  domain/              # ports + errors
  infrastructure/      # providers, security
  schemas/             # Pydantic contracts
  config/              # settings
  main.py              # app factory
```

## Commands

`package.json` scripts resolve `uv` via `scripts/uv.mjs` (PATH or `%USERPROFILE%\\.local\\bin`), so Turbo works even when `uv` is not on PATH.

From repo root or `apps/ai-api`:

```bash
bun run uv -- sync
bun run dev:ai
# or: bun --cwd apps/ai-api run dev
bun --cwd apps/ai-api run lint
bun --cwd apps/ai-api run test
```

Health: `GET http://localhost:8000/api/v1/health`
Assist (service token required): `POST http://localhost:8000/api/v1/assist`

## Internal contract

Every route below requires the `X-AI-Service-Token` header and is only called by NestJS. The
public client contract lives in `apps/docs/content/docs/backend-api.mdx`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/v1/health` | Liveness + configured provider |
| POST | `/api/v1/assist` | Plain-text assistance (legacy) |
| POST | `/api/v1/intelligence/daily` | Structured, grounded Daily Intelligence |
| POST | `/api/v1/chat` | Read-only, context-grounded chat reply |

### Structured output

`/intelligence/daily` and `/chat` ask the provider for JSON through
`LlmProvider.complete_json(task, instructions, context)`, then validate the result against a
Pydantic schema before responding. A payload that fails validation becomes `502`
`AI_INVALID_STRUCTURED_OUTPUT` rather than a wrong answer, and a provider transport failure
becomes `502` `AI_PROVIDER_ERROR`.

Response keys are camelCase (`sourceRefs`, `personalOS`, `financeMonth`) because that is what the
Nest gateway reads; schemas in `schemas/` generate the aliases so the Python side stays snake_case.

Source references must cite ids that exist in the supplied context. The mock provider derives its
payload from that context instead of returning canned text, which is what makes grounding,
empty-context, and refusal behaviour testable without a real model:

```bash
bun --cwd apps/ai-api run test
```

The fixture-driven cases live in `tests/fixtures/` (`daily_evaluation.json`,
`chat_evaluation.json`) and assert that no insight or reply ever cites an invented id.
