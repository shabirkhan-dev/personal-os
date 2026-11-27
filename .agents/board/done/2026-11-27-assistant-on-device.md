---
title: The chat assistant runs on the phone with the person's own key
role: fullstack
status: done
branch: ccr-cdb9b079-navb5d
scope:
  - packages/ai/src/assistant/**
  - packages/ai/src/index.ts
  - packages/ai/package.json
  - apps/api/src/modules/assistant/**
  - apps/api/test/assistant*.test.ts
  - apps/mobile/src/modules/assistant/**
  - apps/mobile/src/modules/profile/components/ai-key-screen.tsx
  - README.md
  - apps/docs/content/docs/backend-api.mdx
  - apps/docs/content/docs/production-roadmap.mdx
---

## Goal

No account and no server needed to talk to the assistant. With their own AI key, the chat (tools,
approvals, undo, memory, past chats, rich cards) runs entirely on the phone.

## What changed

- The agent, prompt, tools, mock model and streaming provider moved from the API into
  `packages/ai/src/assistant`. Tools read and write through an `AssistantStore`, and threads go
  through a `ThreadStore`, so the same code runs over Postgres or over the phone's record store.
- API: `assistant.store.ts` implements the stores over Postgres; routes keep the daily quota as
  a `beforeCall` hook and map `AiError` / `AssistantError` to the same API errors as before.
- Phone: `local-assistant.ts` implements the stores over the encrypted record store
  (`assistant-threads`, `assistant-messages`, `assistant-memories`), and `useAssistantBackend`
  picks the phone with an own key, otherwise the signed-in account. Replies stream with
  `expo/fetch`.

## Validation

- `bunx tsc --noEmit` clean in packages/ai, packages/domain, apps/mobile, apps/api.
- apps/api `bun run test` (Postgres :5433): 14 files, 109 tests passed.
- apps/mobile `bun test`: 374 tests, 0 fail (new `local-assistant.test.ts`: a turn with tools and
  a link card, thread continuation, memories, delete, provider failure).
- packages/ai `bun test`: 25 passed. `bun run architecture:check` passed. oxlint clean.
