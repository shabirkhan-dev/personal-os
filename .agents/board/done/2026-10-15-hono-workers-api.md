---
id: pos-22
title: one hono api on cloudflare workers, replacing nest and the python ai service
type: feature
from: human
to: backend
priority: high
status: done
assignee: backend
reviewer: human
parent: none
depends_on: []
branch: agent/backend/hono-workers-api
worktree: none
scope:
  - apps/api/**
  - apps/nest-api/** (removed)
  - apps/ai-api/** (removed)
  - apps/mobile/src/lib/api/**
  - apps/mobile/src/modules/auth/**
  - apps/mobile/src/modules/users/**
  - apps/mobile/src/modules/career/services/career-ai.ts
  - apps/docs/content/docs/**
  - root tooling (package.json, CI, compose, lint config, scripts, agent hub)
allowed_shared: []
created: 2026-10-15
updated: 2026-10-15
---

## What

Replace the Nest API and the FastAPI AI service with one Hono API on Cloudflare Workers
(`apps/api`): Postgres (Neon) through Hyperdrive, avatars uploaded by the app straight to R2 with
a presigned URL, Cloudflare rate limiting, and the Career AI tasks in TypeScript.

## Why / Context

The owner wants everything on Cloudflare at a flat $5/month with no idle cold starts, kept
simple and module-based, with typed env/settings and one table of messages and status codes.
Sign-in is email code only (Google dropped, pos-12 closed).

## Proposal or Ask

- Same module layout: `src/modules/<name>/{name}.routes|service|repository|schema.ts`.
- `src/config/{env,settings,messages}.ts`; `AppError(code)` and `ok()` for every answer.
- Fresh, smaller schema (no passwords, TOTP, passkeys, identities) in one migration.
- App: new auth paths, camelCase AI contract, direct-to-R2 avatar upload, `EXPO_PUBLIC_API_URL`.

Done when the app's routes all work on the Worker locally, tests pass in CI, and the deploy doc
covers Hyperdrive, R2, secrets and Workers Builds.

## Scope

**In scope:** see `scope`.

**Out of scope:** avatar picker UI (the upload call exists; no screen uses it yet), moving other
modules onto the record store, Drive video streaming.

## Validation

- `bun --cwd=apps/api run test` against Postgres; lint, typecheck, Worker bundle.
- `wrangler dev` end to end: sign-in, refresh rotation and reuse, sync, onboarding, AI, R2 confirm.

## Resolution

Changed: new `apps/api` (Hono on Workers: config/env, settings, messages; core AppError,
envelope, validation, rate limiting; modules auth, users, assets, onboarding, sync, ai, email,
health; fresh Drizzle schema in one migration). Removed `apps/nest-api`, `apps/ai-api`,
`render.yaml`, the Nest/AI Compose fragments, the Python tooling and the NestJS skill. Mobile:
`EXPO_PUBLIC_API_URL`, `/auth/email-code/*`, simplified `User`, direct-to-R2
`usersService.uploadAvatar`, camelCase Career AI. Docs: contract, deploy (Hyperdrive, R2, secrets,
Workers Builds, EAS), local database, system design, roadmap, ADR 0003. pos-12 closed (email only).

Validation:
- `bun --cwd=apps/api run test`: 7 files, 46 tests pass against Postgres 16 (auth, sessions and
  refresh reuse, avatar presign/confirm/replace, sync paging and conflicts, onboarding, AI with
  mock and stubbed provider, page reader, config).
- `bun run lint`, `typecheck`, `test` (mobile 207 pass), `architecture:check`, `naming:check`:
  clean. Worker bundle 692 KiB / 150 KiB gzip. Android export bundles. Docs site builds.
- `wrangler dev` (workerd, Hyperdrive local) end to end: sign-in, `/users/me`, sync push/pull,
  parse-line, private link 422, refresh rotation and reuse 401, 404 and 413 envelopes, rate limit
  429 after 10 auth calls, avatar key refused before upload and accepted after a local R2 put.
- Not verified here: a real Cloudflare deploy, a real presigned PUT to R2, Resend delivery, a
  real model answer.

Contract impact: breaking (see the changelog in `backend-api.mdx`); the app moves in the same PR.
Follow-ups: clean up used sign-in codes on a schedule; avatar picker UI.
