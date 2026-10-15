---
id: pos-22
title: host the ai service next to the api on render
type: chore
from: human
to: backend
priority: normal
status: done
assignee: backend
reviewer: human
parent: none
depends_on: []
branch: agent/backend/render-ai-service
worktree: none
scope:
  - render.yaml
  - apps/docs/content/docs/deploy.mdx
allowed_shared: []
created: 2026-10-15
updated: 2026-10-15
---

## What

One Render Blueprint for the Nest API and the FastAPI AI service, and a deploy doc that covers
hosting both and building the app on EAS from GitHub.

## Why / Context

Career AI needs `apps/ai-api` hosted; the Blueprint only had the API (still named
`starter-nest-api`) with `AI_API_URL` pointing at localhost.

## Scope

**In scope:** `render.yaml`, `apps/docs/content/docs/deploy.mdx`.

**Out of scope:** app code, CI deploy hooks.

## Validation

- Blueprint parses: services `personal-os-api`, `personal-os-ai`.
- AI service boots with the Blueprint's production settings
  (`ENVIRONMENT=production`, `PORT=8000`, `AI_PROVIDER=openai_compatible`) and
  `/api/v1/health` returns `{"status":"ok","provider":"openai_compatible","environment":"production"}`.

## Resolution

Changed: renamed the API service to `personal-os-api`; added `personal-os-ai` (Docker,
`apps/ai-api/Dockerfile`, health check, `PORT=8000`, provider settings, `OPENAI_API_KEY` as
`sync: false`). `AI_SERVICE_TOKEN` is generated on the AI service and copied to the API with
`fromService`; `AI_API_URL` is now `sync: false` (free services cannot receive private-network
traffic, so the API uses the AI service's public URL). Deploy doc gains the two-service steps and
an EAS-from-GitHub section.

Contract impact: none.
