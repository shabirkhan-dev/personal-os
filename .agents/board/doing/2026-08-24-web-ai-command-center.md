---
id: pos-web-ai-command-center
title: Implement web Daily Intelligence and Chat v0
type: feature
from: pm
to: web
priority: high
status: doing
assignee: web
reviewer: reviewer
parent: 2026-08-24-personal-os-intelligence.md
depends_on:
  - 2026-08-24-ai-product-design.md
  - 2026-08-24-ai-control-plane-v0.md
  - 2026-08-24-ai-orchestrator-v0.md
branch: agent/web/web-ai-command-center
worktree: ../personal-os-worktrees/agent/web/web-ai-command-center
scope:
  - apps/web/**
allowed_shared: []
created: 2026-08-24
updated: 2026-09-18
---

## What

Build the responsive web Daily Intelligence surface and context-aware Personal OS Chat v0 using
only the documented NestJS contract.

## Why / Context

Chat is a command center for the user's Personal OS, not a generic blank chat page. The first wave
must make the daily loop useful while remaining read-only and truthful.

## Proposal or Ask

- Add Daily Intelligence cards to the appropriate today surface.
- Add a chat route/panel with message history, context chips, current screen/entity/date context,
  streaming or clearly staged loading, retry, empty, unauthorized, and provider-error states.
- Render source references and suggested actions as non-mutating guidance.
- Preserve keyboard navigation, responsive layouts, focus order, reduced motion, and accessible
  labels.
- Use the existing shared UI primitives and design tokens.

Do not add mutation tools, provider calls, API contracts, or shared-package redesigns.

## Definition of done

- A user can open Daily Intelligence, inspect why an insight exists, and open Chat with context.
- Refresh, logout, API timeout, empty data, and provider failure are handled visibly.
- Browser verification and focused tests cover the interactive chat flow.
- Changed API assumptions are linked to `backend-api.mdx`, not duplicated in code comments.

## Validation

- Read `apps/docs/content/docs/backend-api.mdx` and relevant Next.js docs first.
- `bun --cwd apps/web run lint`
- `bun --cwd apps/web run typecheck`
- `bun --cwd apps/web run test`
- `bun run test:e2e:web` and browser verification for chat interactions

## Resolution

Partial implementation, now **committed and pushed** so it cannot be lost. Integration is still
blocked.

**Custody note.** The implementation agent left this work entirely uncommitted (13 files, 0
commits) and its session stopped. On 2026-09-18 the human product owner instructed a different
session — backend role — to commit and push it as-is. The change was committed verbatim: not
rewritten, squashed, rebased, cherry-picked, or merged, and no other agent's file was included.
The commit is recorded under the repo's configured identity, which is the human owner's, so the
authorship line does not by itself identify the implementing agent.

Refs:
- `c3266c3 feat(web): add daily intelligence and chat command center v0` — 13 files, +795/-238,
  on `agent/web/web-ai-command-center`, **pushed** to origin.
- **Not merged.** `main` is unaffected by this commit.
- Worktree retained at `../personal-os-worktrees/agent/web/web-ai-command-center`.

Changed in `agent/web/web-ai-command-center`:
- `apps/web/src/modules/ai/**`: gateway service, session response adapter, query hooks,
  context parsing, Daily Intelligence panel, and persistent admin chat UI.
- `apps/web/src/app/admin/today/page.tsx`: mounts Daily Intelligence.
- `apps/web/e2e/ai.spec.ts`: mocked session creation, message send, reload/history test.
- `apps/web/playwright.config.ts`: optional system Chromium executable override.
- `apps/web/src/modules/chat/styles/chat.css`: closes an existing unterminated comment
  that prevented the production build.

Validation from the implementation worktree:
- Web `bun run lint`: passed.
- Web `bun run typecheck`: passed.
- Web `bun run test`: 14 passed.
- Web `bun run build`: passed.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium bun run test:e2e:web`:
  5 passed on final run. An earlier full run timed out after reload; isolated and full
  reruns passed. Browser tests mock Nest, not live provider integration. Port: 3005.
- Root `bun run typecheck`: passed (four tasks cached).
- Root `bun run lint`: failed because ShellCheck is unavailable. Cached Rust lint output
  also contains a SQLx environment failure masked by the existing package script.
- Root `bun run format`: Biome found no changes; shfmt unavailable and skipped by script.

Independent re-run by the committing session on `c3266c3` (2026-09-18):
- `apps/web` lint (`biome check .`): clean, 220 files.
- `apps/web` typecheck (`tsc --noEmit`): clean.
- `apps/web` test (`vitest run`): 4 files, **14 passed** — matches the claim above.
- `apps/web` build (`next build`): **failed once, then passed on immediate retry** (exit 0,
  28/28 static pages). The failure was Next's internal Google-font CSS resolving as
  `module-not-found`; no application module was involved. Disclosed because a single green run
  would overstate confidence — the build has a flaky local dependency.
- **Not re-run:** `test:e2e:web`, root lint, root format.

Contract impact:
- No backend API modifications. Reference: `apps/docs/content/docs/backend-api.mdx`.
- Session create/list code returns flat context fields; docs specify nested `context`.
  Web adapter accepts both; one mocked-fetch test covers both create response shapes.
  Backend owner still needs to reconcile the source-of-truth documentation.

Remaining work and integration gates:
- Independent review has not completed; the review-agent invocation was aborted.
- The branch is pushed but **no PR exists**, so required CI has still never run on this change.
- Main advanced past `f28aeb2` to `0684669`; the staged coordination edits the implementation
  agent noted were never reset, stashed, or taken over by it, and were committed separately by
  their owners.
- Live Nest/Postgres/provider verification unavailable: Docker socket permission denied.
- `/chat/new-chat` remains the older UI; migration and broader failure-path, account-switch,
  Today-to-chat, and responsive verification remain outstanding.
- Design and backend dependency cards remain unresolved. This card stays in `doing/`.

Commit: `c3266c3`. Review: pending. Branch pushed to origin; worktree retained.
