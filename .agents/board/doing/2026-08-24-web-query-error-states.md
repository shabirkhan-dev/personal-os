---
from: human
to: web
priority: normal
status: doing
assignee: web
reviewer: reviewer
branch: agent/web/query-error-states
worktree: ../personal-os-worktrees/agent/web/query-error-states
scope:
  - apps/web/**
created: 2026-08-24
updated: 2026-09-16
---

# Add actionable query and mutation error states to routines

## Context

The admin routines and today surfaces primarily branch on `isLoading` and
`data`. A failed fetch can look like an empty/zero-state screen, and mutation
failures do not consistently give the user a retry or recovery path. This is
especially difficult to diagnose while the routines API is being integrated.

Relevant code: `apps/web/src/modules/routines/components/today-view.tsx`,
`apps/web/src/modules/routines/components/routine-manager.tsx`, and their
query/mutation hooks.

## Requested outcome

Render explicit error states with retry actions, preserve the last successful
data during background refetches where appropriate, and surface failed toggle or
CRUD mutations without leaving stale controls enabled.

## Definition of done

- Initial fetch errors are distinct from valid empty states.
- Users can retry without a full page reload.
- Failed mutations show feedback and restore a usable control state.
- Focused tests cover fetch, refetch, and mutation failure paths.

## Resolution

(open)
