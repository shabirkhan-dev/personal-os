---
id: pos-20
title: Offline-first record store and sync engine
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude
reviewer: human
parent: none
depends_on: []
branch: agent/mobile/offline-sync-career
worktree: none
scope: ["apps/mobile/src/lib/**", "apps/mobile/src/components/providers.tsx", "apps/mobile/package.json", "apps/nest-api/src/modules/sync/**", "apps/nest-api/src/database/**", "apps/nest-api/src/app.module.ts", "apps/docs/content/docs/**"]
allowed_shared: ["bun.lock"]
created: 2026-10-15
updated: 2026-10-15
---

## What

Give the app one offline-first data layer: an on-device SQLite record store that every module can
use, React Query on top for reads, and a sync engine that backs records up to the API and brings
them to a second device.

## Why / Context

Module data lives in per-module JSON files with no backup (ADR 0001). The owner wants the whole
app offline-first with sync, kept simple. Career (pos-21) is the first module on it.

## Proposal or Ask

- Mobile: `expo-sqlite` table `records(collection, id, data, updated_at, deleted_at, dirty)`;
  typed collections per module; React Query keys per collection; a sync client that pushes dirty
  rows and pulls changes after a cursor (on start, foreground, after writes, sign-in).
- Account isolation: local records belong to the signed-in user; a different account clears them.
- API: `POST /sync` with `sync_records(user_id, collection, id, data, updated_at, deleted_at, seq)`;
  last write wins per record by `updated_at`; pull pages by per-row `seq`.
- Docs: ADR 0002, backend-api contract.

Done when Career reads and writes only through this layer, sync round-trips in tests, and the
existing modules are untouched (moving them over is a follow-up card).

## Scope

**In scope:** see `scope`.

**Out of scope:** moving Finance, Workout, Skincare and Food off JSON files; R2 uploads.

## Validation

- mobile lint, typecheck, test (store and sync engine against `bun:sqlite`)
- nest lint, typecheck, unit + DB integration test for `/sync`
- migration generated and applied

## Resolution

Shipped in 9a2cd00 on `agent/mobile/offline-sync-career`; design in
`apps/docs/content/docs/architecture/adr-0002-offline-first-sync.mdx`.

Changed:
- `apps/mobile/src/lib/db/**`, `apps/mobile/src/lib/sync/**`, `apps/mobile/src/components/providers.tsx`
- `apps/nest-api/src/modules/sync/**`, `sync_records` schema + migration 0007, `app.module.ts`, `app.setup.ts` (1 MB JSON limit)

Validation:
- mobile `bun test src` → 207 pass (store and engine against `bun:sqlite`), lint 0, typecheck clean
- nest `test:integration` against local Postgres 16 → 7 pass (5 sync), unit 27 pass, lint 0, typecheck clean
- live: two in-memory devices converged through the running API (260 records paged, delete propagated)
- `expo export --platform android` bundles

Contract impact: `POST /sync` added to backend-api.mdx (changelog 2026-10-15).

Follow-up: move Finance, Workout, Skincare and Food onto the store (roadmap item 3). Needs a new
development build (`expo-sqlite`).
