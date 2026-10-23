---
id: pos-35
title: ai task that drafts a training program from the exercise catalog
type: feature
from: mobile
to: backend
priority: normal
status: doing
assignee: backend (claude code)
reviewer: human
parent: 2026-10-24-training-programs.md
depends_on: []
branch: agent/mobile/training-programs
worktree: main checkout (light mode)
scope: [apps/api/src/modules/ai, apps/api/test/ai.test.ts, apps/docs/content/docs/backend-api.mdx]
allowed_shared: []
created: 2026-10-24
updated: 2026-10-24
---

## What

`POST /ai/training/program`: from a goal, sports, equipment, days a week, minutes and the list of
exercise ids the app knows, return a program draft that only uses those ids.

## Why / Context

pos-34 lets people design programs with AI; the app reviews the draft before saving it.

## Proposal or Ask

Strict request schema, zod-checked answer (unknown exercise ids dropped, sizes capped), mock
provider answer, tests, and the contract plus changelog in `backend-api.mdx` (also listing the two
new Training collections).

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** deploying the Worker (owner).

## Validation

- `bun --cwd=apps/api run lint`, `typecheck`, `test`

## Resolution
