---
id: pos-40
title: Shorter onboarding, one welcome screen and no Connect step
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: pos-39
depends_on: []
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/src/app/(onboarding)/**", "apps/mobile/src/modules/onboarding/**", "DESIGN.md"]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

Onboarding went from four welcome slides plus 7 setup steps to one welcome screen plus 6 steps.

## Why / Context

The four intro slides came before any input, and the Connect step listed only "Soon" items
(the microphone is asked for when it is first used). The reminders step led with a "Hey OS · Soon"
row for a feature that lives in Profile.

## Proposal or Ask

Fold frames 02–05 into the Modules welcome, drop Connect, drop the Hey OS row, renumber to 6 steps,
and record the decision in DESIGN.md.

## Scope

**In scope:** see `scope`. **Out of scope:** the voice path, plan reveal, sign-in and the OS card.

## Validation

- `bun --cwd=apps/mobile run typecheck` and `bun --cwd=apps/mobile run lint`: clean.
- `bun --cwd=apps/mobile test`: 303 pass.
- Walked the web export (`preview:web`) from welcome to Home in Playwright at 390×844, dark mode.

## Resolution

Removed `welcome-upcoming`, `welcome-voice`, `welcome-homes`, `connect` and their previews and
`StepDots`. DESIGN.md "Figma source" records the trimmed flow.
