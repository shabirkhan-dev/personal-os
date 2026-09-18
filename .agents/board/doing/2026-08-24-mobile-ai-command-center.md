---
id: pos-mobile-ai-command-center
title: Implement mobile Daily Intelligence and Chat v0
type: feature
from: pm
to: mobile
priority: high
status: doing
assignee: mobile
reviewer: reviewer
parent: 2026-08-24-personal-os-intelligence.md
depends_on:
  - 2026-08-24-ai-product-design.md
  - 2026-08-24-ai-control-plane-v0.md
  - 2026-08-24-ai-orchestrator-v0.md
branch: none
worktree: none
scope:
  - apps/mobile/**
allowed_shared: []
created: 2026-08-24
updated: 2026-09-18
---

## What

Build the native mobile Daily Intelligence surface and context-aware Personal OS Chat v0 using
only the documented NestJS contract.

## Why / Context

Mobile is the primary daily logging surface. The AI should be available inside the daily workflow,
understand the current route/entity/date, and remain useful on small screens without becoming a
full-screen generic chatbot.

## Proposal or Ask

- Add Daily Intelligence to the appropriate today/dashboard surface.
- Add a native chat route/sheet with message history, context chips, keyboard-safe layout, current
  screen/entity/date context, retry/error/empty/offline states, and accessible controls.
- Render source references and suggested actions as non-mutating guidance.
- Use Expo Router, safe-area-context, existing UI primitives, and semantic Uniwind/Tailwind tokens.
- Preserve the module bottom navigation and session/user isolation.

Do not add mutation tools, provider calls, API contracts, or a second theme/design system.

## Definition of done

- A user can open Daily Intelligence, inspect the insight source, and open Chat with context.
- Keyboard, resume, logout, unauthorized, timeout, empty-data, and offline states are truthful.
- No no-op controls, fake success states, hardcoded provider colors, or cross-user cache leakage.
- Device/simulator verification covers the primary chat flow and narrow-screen layout.

## Validation

- Read `apps/docs/content/docs/backend-api.mdx` and the Expo mobile skill first.
- `bun --cwd apps/mobile run lint`
- `bun --cwd apps/mobile run typecheck`
- `bun --cwd apps/mobile run test`
- Relevant Expo/device validation and screenshots

## Resolution

Implementation is **merged on `main` as `f28aeb2`** (`feat(mobile): add daily intelligence and
personal os chat v0`, 2026-09-17, 16 files, +1316/-76). The commit was authored and committed by
the human product owner, so this is an owner commit of the mobile agent's work rather than an
agent push to `main`. This card was moved `open/ → doing/` on 2026-09-18 so the board matches the
merged state; it is not closed, because no review has been recorded.

### Changed (per commit `f28aeb2`)

- `apps/mobile/src/modules/ai/**` (new): types, service, `use-ai-queries`/`use-ai-mutations`,
  components (`daily-insights-widget`, `insight-item`, `chat-composer`, `chat-context-banner`,
  `chat-message-bubble`), plus `use-ai-queries.test.tsx`.
- `apps/mobile/src/app/(modules)/(dashboard)/`: `_layout.tsx`, `index.tsx` (mounts the insights
  widget), `insights.tsx`, `chat.tsx` (new).
- `.agents/notes/mobile.md`: implementation note.

### Validation

Verified by a different session on the merged revision of `main` (2026-09-18), not self-reported:

- `apps/mobile` test: **8 suites, 39 passed** — consistent with the 39 claimed in
  `.agents/notes/mobile.md`.
- `apps/mobile` typecheck (`tsc --noEmit`): clean.

Not evidenced anywhere yet:

- The card's device/simulator verification and screenshots.
- The offline, unauthorized, timeout, and empty-data states named in the Definition of done.
- `bun --cwd apps/mobile run lint` on the merged revision.

### Review

- **Pending.** `reviewer: reviewer`; no review exists on `f28aeb2` and no verdict is recorded in
  any `.agents/notes/` file. An independent review of the merged commit is required before this
  card closes.

### Open dependencies

`depends_on` lists `2026-08-24-ai-product-design.md` (unclaimed, no work), and
`2026-08-24-ai-control-plane-v0.md` / `2026-08-24-ai-orchestrator-v0.md` (both `doing/`, both
carrying changes requested). The mobile surface shipped ahead of all three, so its contract and
visual-language conformance to `DESIGN.md` has never been checked.

### Known limitations (disclosed, not blocking)

- No branch or worktree was used; the work went to `main` directly, so there is no isolated diff
  to review beyond the commit itself.
- Board metadata is therefore retrospective: this card cannot be used to reconstruct the
  implementation window.
