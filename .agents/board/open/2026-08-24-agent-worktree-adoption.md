---
id: pos-agent-worktrees
title: adopt isolated agent worktrees
type: announcement
from: human
to: all
priority: high
status: open
assignee: none
reviewer: none
parent: none
depends_on: []
branch: none
worktree: none
scope:
  - .agents/worktrees.md
  - scripts/bash/worktree.sh
allowed_shared: []
created: 2026-08-24
updated: 2026-08-24
---

## What

New implementation cards use one role-specific branch and Git worktree. The shared `main`
worktree is integration-only for new work.

## Why / Context

Worktrees prevent agents from editing the same working directory, while the role contract and
ownership map protect scope. Read `.agents/worktrees.md` and `.agents/agent-contract.md` before
claiming new work.

## Proposal or Ask

Use `bun run worktree -- add <role> <card-slug>`, record the resulting branch and path on the
card, choose unique ports, and push the agent branch for review. Existing work already started on
`main` may finish during the migration window; do not move uncommitted files implicitly.

## Resolution

(open)
