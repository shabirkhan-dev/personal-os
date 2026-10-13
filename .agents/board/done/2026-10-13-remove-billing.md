---
id: pos-10
title: Remove the billing module from the Nest API
type: chore
from: human
to: backend
priority: normal
status: done
assignee: claude-code
reviewer: human
parent: pos-8
depends_on: []
branch: ccr-f7a44e55-46aj0i
worktree: none
scope: ["apps/nest-api/**", "apps/docs/content/docs/backend-api.mdx", "env.docker.example", "render.yaml"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

Delete the Starter billing module (Stripe and Razorpay providers, routes, repository, tables) and
its configuration.

## Why / Context

Decision on pos-8: Personal OS keeps auth, MFA, passkeys, email and social auth, but not billing.

## Proposal or Ask

Remove `src/modules/billing`, its module registration, env keys, payment SDK dependencies and the
billing schema (with a migration that drops the tables). Update `backend-api.mdx`.

## Scope

**In scope:** `apps/nest-api/**`, `apps/docs/content/docs/backend-api.mdx`, `env.docker.example`, `render.yaml`

**Out of scope:** other modules.

## Validation

- nest lint, typecheck, test, build

## Resolution

Changed:
- removed `apps/nest-api/src/modules/billing/**` and `subscriptions.schema.ts`; `BillingModule` unregistered
- removed billing env keys from `env.schema.ts`, `app.config.ts`, `app-config.service.ts`, `.env.example`
- removed `stripe` and `razorpay` dependencies
- migration `0004_drop_billing.sql` drops `subscriptions`
- nest README and docs pages no longer list billing

Validation:
- nest lint, typecheck: clean; `vitest run`: 15 pass; `test:e2e`: 4 pass; `nest build`: OK

Contract impact: billing routes are gone (they were never in `backend-api.mdx`).
