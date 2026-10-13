---
id: str-refresh-design-and-agent-docs
title: Refresh DESIGN.md, AGENTS.md and the roadmap to match the repo
type: chore
from: human
to: ui-ux
priority: high
status: done
assignee: ui-ux
reviewer: human
parent: none
depends_on: []
branch: agent/ui-ux/refresh-design-and-agent-docs
worktree: ../starter-worktrees/agent/ui-ux/refresh-design-and-agent-docs
scope:
  - DESIGN.md
  - AGENTS.md
  - .agents/plans/next-phase-roadmap.plan.md
  - .agents/rules/project-conventions.mdc
  - .agents/rules/clean-code.mdc
  - .agents/rules/antigravity.mdc
  - .agents/skills/antigravity/**
  - .agents/skills/hono/**
  - .agents/skills/domain-cli/**
  - skills-lock.json
  - PROJECT.md
  - .github/ISSUE_TEMPLATE/feature.yml
  - .agents/board/**
allowed_shared:
  - AGENTS.md
  - .agents/plans/**
  - .agents/rules/**
created: 2026-10-07
updated: 2026-10-07
---

## What

Bring the agent-facing docs back in line with the code, and record the agreed direction for
rebuilding the UI library.

## Why / Context

- `DESIGN.md` describes `packages/rabtx/src/button/*` (shared choices, native button, ripple, docs
  preview) that the "reset the Button to a verbatim shadcn copy" commit removed. Only
  `packages/rabtx/src/button.tsx` exists.
- `AGENTS.md` does not list `packages/rabtx` and still frames `@starter/ui` as the source of truth.
- The roadmap plan references `apps/hono-api` and `apps/c`, which do not exist, and marks work as
  pending that has since landed (CI build job, architecture boundary check, zero-warning lint).
- `.agents/rules/{project-conventions,clean-code}.mdc` still say `@school-os/*`.
- Owner decision (2026-10-07): the UI library is rebuilt from scratch on modern platform features;
  shadcn stays only as the CLI; HugeIcons is the only icon set; the Reptex/Grid Figma system is the
  design source.

## Proposal or Ask

Done when each doc states only what is true today, the new direction is recorded as direction (not
as implemented), and open decisions are listed as open rather than guessed.

## Scope

**In scope:**

- The paths listed in `scope`.

**Out of scope:**

- Any component implementation, token change or dependency change.
- Pruning skills other than antigravity, hono and domain-cli (domain-web is kept: apps/rust is Axum).
- Stale `hono-api` and NativeWind mentions in `apps/docs/content/docs/*.mdx` (follow-up).
- Figma-specific tokens and the animation spec, which the owner has not shared yet.

## Validation

- `bun run format` and `bun run lint` clean in the worktree.
- `bun run naming:check` and `bun run architecture:check` pass.
- Every path named in the edited docs exists (`git ls-files` spot check).

## Resolution

Refreshed DESIGN.md (direction, dependency policy, open decisions, accurate implementation state),
AGENTS.md, PROJECT.md and the roadmap plan; fixed `@school-os` and `hono-api` leftovers in
`.agents/rules` and the feature issue template; removed the antigravity skill and rule, the hono
and domain-cli skills, and their `skills-lock.json` entries. Owner approved on 2026-10-07 and asked
for commit, PR and merge. `bun run lint`, `bun run format`, `naming:check` and `architecture:check`
pass.
