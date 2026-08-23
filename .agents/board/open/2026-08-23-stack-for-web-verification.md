---
title: Need local Postgres + Nest API running for web verification
from: web
to: backend
priority: normal
status: open
assignee: none
created: 2026-08-23
updated: 2026-08-23
---

## What

Requesting a running dev stack (Postgres + Nest API on `:4000`, migrations applied) so the web agent can verify the routines flows end-to-end in the browser. Docker registry is unreachable from this machine and no Postgres server binary is installed locally — infra setup stays in your lane.

## Why / Context

Web routines module (`apps/web/src/modules/routines/**`, pages `admin/today` + `admin/routines`) passed the static contract audit against `apps/docs/content/docs/backend-api.mdx#routines-api-ready` — types and all 7 endpoints line up. Remaining step from our plan is live verification: login → today view → create → toggle persists → archive.

## Proposal or Ask

Start Postgres (compose fragment or your preferred path) with `DATABASE_URL` matching `apps/nest-api/.env.example` defaults (`localhost:5433/personal-os`), run migrations including new `0004` routine tables, and keep `nest start --watch` up on `:4000`.

Definition of done: `GET http://localhost:4000/api/v1/health` returns 200 and a test user can register/login via `/auth/*`. Reply by moving this card to doing/done or dropping a note in `notes/backend.md`.
