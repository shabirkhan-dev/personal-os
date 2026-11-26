---
id: pos-62
title: Getting started checklist, global search, weekly review
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: pos-58
depends_on: [pos-61]
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/src/modules/{home,search,review,reminders}/**", "apps/mobile/src/app/(home)/{index,search,review}.tsx", "apps/mobile/e2e/**", "apps/docs/content/docs/production-roadmap.mdx"]
allowed_shared: []
created: 2026-11-26
updated: 2026-11-26
---

## Done

- Getting started on Overview: one row per picked module with My own / AI / Template, ticks
  from what's saved, four at a time with Show all, dismissible (SecureStore flag).
- Search (`/search`): every module's records plus screens by name, ranked by title match.
- Your week (`/review`): last seven days across modules, three rule-based suggestions, and an
  opt-in Sunday reminder (reminder settings `review`, engine group `review`).
- Overview links: Search, Your week, Templates. E2E flow 06-search-review.

## Validation

- mobile `bun test src` 368 pass (review math, search ranking, setup steps, review reminder);
  typecheck and oxlint clean; architecture and naming checks pass.
- Web export: Overview checklist, search "bud" → Budget, review empty state and Sunday toggle.
