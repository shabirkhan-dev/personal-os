---
id: pos-38
title: tool-calling assistant with chat, approvals, undo and memory, career first
type: feature
from: human
to: backend
priority: high
status: done
assignee: backend + mobile (claude code)
reviewer: human
parent: null
depends_on: []
branch: agent/backend/assistant-career
worktree: main checkout (light mode)
scope: [packages/domain, apps/api/src/modules/assistant, apps/api/src/db, apps/api/test/assistant.test.ts, apps/mobile/src/modules/assistant, apps/mobile/src/app/(home)/assistant, apps/mobile/src/modules/career, apps/mobile/src/components/module-screen.tsx, apps/mobile/src/app/(home)/index.tsx, apps/mobile/src/modules/profile, apps/docs/content/docs]
allowed_shared: [apps/mobile/src/lib/api/client.ts, apps/mobile/src/lib/storage/parse.ts]
created: 2026-10-30
updated: 2026-10-30
---

## What

Replace the one-shot AI forms with one assistant that knows the person's data and can change
it: tool calling over synced records, streamed answers with rich cards, a chat screen and an
in-screen assistant that knows what is on screen, approvals per a setting, undo, saved
conversations and memory. Career first; any OpenAI-compatible model (DeepSeek now).

## Why / Context

The owner asked for an assistant that is not generic: full context, real tools, rich answers
(better than a plain chat), and asking before it changes things, with a setting for how often.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** tools for the other modules (next cards), voice into the chat, deploying the
Worker and applying migration 0003 to Neon (owner).

## Validation

- `bun --cwd=apps/api run lint`, `typecheck`, `test`; `bun --cwd=apps/mobile run typecheck`,
  `test`; `bun --cwd=packages/domain run test`; `bun run architecture:check`

## Resolution

API: `apps/api/src/modules/assistant` (streamed loop, tools, approvals, undo, threads, memory),
migration `0003_assistant`. Shared: `@personal-os/domain` (`parse`, `career` model and pure
operations, `assistant` contract); the app's Career actions use the same operations. App:
`modules/assistant` (chat, cards, Ask button on Career screens, Overview and Career Home, past
chats, settings with the approval choice and memories), Overview's ask bar hands questions to
the assistant. Docs: Backend API (contract and changelog) and Product System Design.

Validation run: API 97 tests pass (6 new); mobile 300 pass (3 new); domain 5 pass; lint 0
warnings; typecheck clean; architecture OK. On the local Worker (`wrangler dev`, mock model) a
streamed answer reached the web app with its step and stats card. The approval and undo flow is
covered by the API tests with a stubbed tool-calling model; not yet tried against DeepSeek.
