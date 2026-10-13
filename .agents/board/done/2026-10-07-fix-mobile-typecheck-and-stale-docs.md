---
id: str-fix-mobile-typecheck-and-stale-docs
title: Fix the CI typecheck failure and remaining stale docs
type: bug
from: human
to: mobile
priority: high
status: done
assignee: mobile
reviewer: human
parent: str-refresh-design-and-agent-docs
depends_on: []
branch: agent/mobile/fix-typecheck-and-stale-docs
worktree: ../starter-worktrees/agent/mobile/fix-typecheck-and-stale-docs
scope:
  - apps/mobile/src/expo-types.d.ts
  - apps/docs/content/docs/apps-overview.mdx
  - apps/docs/content/docs/quick-start.mdx
  - apps/docs/content/docs/ai-first-workflow.mdx
  - apps/docs/content/docs/product-system-design.mdx
  - apps/docs/content/docs/production-roadmap.mdx
  - apps/docs/src/app/(home)/page.tsx
  - apps/web/src/app/ui/[slug]/page.tsx
  - .agents/skills/expo-mobile/SKILL.md
  - .agents/rules/expo-ai-agents.mdc
  - .agents/board/**
allowed_shared:
  - apps/docs/content/docs/**
  - apps/web/**
  - .agents/skills/**
  - .agents/rules/**
created: 2026-10-07
updated: 2026-10-07
---

## What

Make `bun run typecheck` pass on a fresh checkout, and remove the remaining stale `hono-api` and
NativeWind references.

## Why / Context

`main` failed CI on every run since 2026-10-03: `apps/mobile/src/app/_layout.tsx` imports
`../global.css`, whose module declaration comes from `expo/types`. That reference lives only in the
generated, gitignored `apps/mobile/expo-env.d.ts`, so `tsc` passed locally and failed in CI.
Follow-ups listed on `str-refresh-design-and-agent-docs`.

## Proposal or Ask

Track a small declaration file that references `expo/types`; update the docs, the Expo skill and
rule, and two source files to match the repo (Nest API and AI API instead of Hono, Uniwind instead
of NativeWind); remove a background image URL that points at a local path on one machine.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:**

- `CHANGELOG.md`, `dependency-upgrade-report.mdx` (dated history) and `.agents/uniwind.txt`
  (vendored Uniwind docs).
- The `dependency-review` job, which needs the repository's Dependency graph setting enabled.
- The failing CD workflow.

## Validation

- `bun run typecheck` passes in a fresh worktree where `expo-env.d.ts` does not exist.
- `bun run lint`, `bun run format`, `bun run naming:check` and `bun run architecture:check` pass.
- CI on the pull request.

## Resolution

Added `apps/mobile/src/expo-types.d.ts`; corrected the docs, skill, rule and two source files.
Typecheck passes on all 7 packages in a fresh worktree. CI result recorded on the pull request.
