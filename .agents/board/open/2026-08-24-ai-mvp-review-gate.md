---
id: pos-ai-mvp-review-gate
title: Independently review Personal OS Intelligence MVP
type: feature
from: pm
to: reviewer
priority: high
status: open
assignee: reviewer
reviewer: human
parent: 2026-08-24-personal-os-intelligence.md
depends_on:
  - 2026-08-24-ai-product-design.md
  - 2026-08-24-ai-control-plane-v0.md
  - 2026-08-24-ai-orchestrator-v0.md
  - 2026-08-24-web-ai-command-center.md
  - 2026-08-24-mobile-ai-command-center.md
  - 2026-08-24-ai-mvp-verification.md
branch: none
worktree: none
scope: []
allowed_shared: []
created: 2026-08-24
updated: 2026-08-24
---

## What

Act as the independent release gate for the first Personal OS Intelligence vertical slice.

## Review focus

- Card scope, worktree, changed-file lists, and role ownership.
- API contract compatibility and source-of-truth updates.
- Authorization, user isolation, privacy minimization, provider-key handling, rate limits, and
  failure behavior.
- Structured AI output, unsupported claims, truthful UI states, and no silent writes.
- Web/mobile design consistency, accessibility, responsive/device behavior, and validation evidence.

## Definition of done

Inspect implementation and tests directly, verify reported checks, and end with exactly one of:
approved, changes requested, blocked with evidence, or rejected with linked reasons. Do not rewrite
implementation or approve without QA evidence.

## Validation

- Review every parent-linked child card and commit.
- Run focused checks where evidence is insufficient.
- Record findings with exact file/line references and severity.

## Resolution

Open.
