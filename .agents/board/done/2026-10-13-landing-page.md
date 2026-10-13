---
id: pos-16
title: Build the landing page for Cloudflare Pages
type: feature
from: human
to: web
priority: high
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: [pos-15]
branch: ccr-f7a44e55-46aj0i
worktree: none
scope: ["apps/web/**", "package.json", "bun.lock", "turbo.json", ".gitignore", "*.md", "apps/docs/content/docs/**"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

Build the Figma "Landing" page in `apps/web` and make it deployable on Cloudflare Pages. Android
and iOS are both "coming soon"; visitors can leave an email for launch day.

## Scope

**In scope:** see `scope`. The app name stays "Personal OS".

## Validation

- web build (static export), lint, typecheck; repo typecheck, lint, build; desktop and 390px renders

## Resolution

Changed:
- `apps/web` is back in the Bun workspace and Turbo (`out/**` added to build outputs). Next.js
  `output: "export"` with unoptimized images; `vercel.json` and `DISABLED.md` removed.
- Page sections in `src/modules/landing` (nav, hero with three phones, why, modules, how it works,
  sign-up, footer), styled from tokens in one CSS module; responsive at 960px and 720px.
- App screens exported from Figma at 2x as WebP (`public/screens`, about 140 KB total).
- `functions/api/notify.ts`: Pages Function storing `email:<address>` in KV binding `WAITLIST`;
  validates and normalises the address, caps the body at 1 KB, returns 503 if the binding is
  missing. `public/_headers` adds security headers and long caching for `/_next/static`.
- Docs: `apps/web/README.md` has the Cloudflare Pages steps; deploy, overview and README updated.

Validation:
- web: `next build` exports `/` statically; oxlint and tsc clean
- repo: typecheck (6 tasks), turbo lint (7 tasks) and build pass; architecture and naming checks pass
- Function checked with a fake KV: valid, duplicate, invalid, non-JSON, oversized and unbound cases
- Rendered at 1440px and 390px with headless Chromium

Not done: no Turnstile or rate limiting on the sign-up yet; add Turnstile if it gets spam.

Follow-up: the owner deployed with Workers Builds, whose `npx wrangler deploy` tried to convert the
app with OpenNext and failed on `workspace:*`. Added `wrangler.jsonc` (static assets from `out/`,
`run_worker_first: ["/api/*"]`) and moved the sign-up into `worker/` (was a Pages Function).
Checked with `wrangler deploy --dry-run` and `wrangler dev`: page 200 with `_headers` applied,
404 page, `/api/notify` 200/400/405 as expected.
