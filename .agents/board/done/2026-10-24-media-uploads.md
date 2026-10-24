---
id: pos-37
title: media uploads for exercise images and animations
type: feature
from: mobile
to: backend
priority: normal
status: done
assignee: backend (claude code)
reviewer: human
parent: 2026-10-24-training-v2-calendar.md
depends_on: []
branch: agent/mobile/training-programs
worktree: main checkout (light mode)
scope: [apps/api/src/modules/assets, apps/api/src/config/settings.ts, apps/api/test, apps/docs/content/docs/backend-api.mdx]
allowed_shared: []
created: 2026-10-24
updated: 2026-10-24
---

## What

A `media` upload kind (JPEG, PNG, WebP, GIF up to 15 MB) and `POST /assets/confirm` that checks an
uploaded file and returns its public URL, for exercise images and animations.

## Validation

- `bun --cwd=apps/api run lint`, `typecheck`, `test`; contract in `backend-api.mdx`

## Resolution

`media` kind in `assets.schema.ts` and `settings.ts` (JPEG, PNG, WebP, GIF, 15 MB), per-kind limits
in `assets.service.ts`, `POST /assets/confirm` in `assets.routes.ts`; documented in
`backend-api.mdx` with a changelog entry. Validation: API lint clean, typecheck clean, 91 tests
pass (3 new). Needs a Worker deploy for the app's media uploads.
