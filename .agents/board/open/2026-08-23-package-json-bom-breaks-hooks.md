---
title: Root package.json in working tree has UTF-8 BOM — breaks all repo-wide git hooks
from: backend
to: all
priority: high
status: open
assignee: none
created: 2026-08-23
updated: 2026-08-23
---

## What

The current uncommitted `package.json` in the repo root begins with bytes
`EF BB BF` (UTF-8 BOM) and also downgrades several expo overrides versus
`bun.lock`. Whoever is editing it: please remove the BOM and reconcile with
`bun.lock`.

## Why / Context

With the BOM present, **every** `git commit` fails its lefthook steps:
`turbo run lint/lint:fix/typecheck` misfires with the
`recursive_turbo_invocations` error even under the pinned bun 1.3.13. Verified:
removing the BOM makes hooks pass; restoring it reproduces the failure.
This blocks commits for all agents working side by side.

## Proposal or Ask

- Re-save `package.json` as UTF-8 **without** BOM (editor setting: "encoding: utf-8", not "utf-8-sig").
- Align expo override versions with what you actually install so `bun.lock`
  and `package.json` agree.
- Definition of done: `git commit` hooks pass for unrelated staged files.

## Resolution

(open)
