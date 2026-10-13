---
id: pos-1
title: Adopt the .agents board in light mode
type: chore
from: human
to: pm
priority: normal
status: done
assignee: claude-code (pm)
reviewer: human
parent: none
depends_on: []
branch: ccr-f7a44e55-46aj0i
worktree: none
scope: [".agents/**", ".wtp.yml", "AGENTS.md"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

Use the repo's own `.agents/board` as the Personal OS project board (not GitHub Projects), in a
light mode that fits one owner and one agent at a time.

## Why / Context

The hub came from the Starter's multi-agent setup (worktree per card, reviewer agent, PM agent).
The owner wants the board but not the full ceremony.

## Proposal or Ask

Add a light-mode section to `agent-contract.md`, clean the remaining Starter references, and seed
the board with the next cards. Done when the board has open cards and the docs describe light mode.

## Scope

**In scope:** `.agents/**`, `.wtp.yml`, `AGENTS.md`

**Out of scope:** application code.

## Validation

- `bun run lint`, `bun run architecture:check`

## Resolution

Light mode added to `agent-contract.md` and summarised in `AGENTS.md`; Starter/Codex references
removed from the PM charter, ownership map, worktrees doc, rules and `.wtp.yml`; card ids now
`pos-<n>`; cards pos-2 to pos-9 raised in `open/`.
