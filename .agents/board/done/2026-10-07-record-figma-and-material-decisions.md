---
id: str-record-figma-and-material-decisions
title: Record the Figma source and the radius, depth and kind decisions
type: decision
from: human
to: ui-ux
priority: high
status: done
assignee: ui-ux
reviewer: human
parent: str-refresh-design-and-agent-docs
depends_on: []
branch: agent/ui-ux/record-figma-and-material-decisions
worktree: ../starter-worktrees/agent/ui-ux/record-figma-and-material-decisions
scope:
  - DESIGN.md
  - AGENTS.md
  - .agents/plans/next-phase-roadmap.plan.md
  - .agents/board/**
allowed_shared:
  - AGENTS.md
  - .agents/plans/**
created: 2026-10-07
updated: 2026-10-07
---

## What

Write the owner's Figma link, the new variant model and the animation reference into `DESIGN.md`.

## Why / Context

Owner decisions (2026-10-07, in chat):

- Figma file `en7xSFtcVYHkX7Iwo4hONQ` is the design source; beUI is the animation preference.
- `terminal` is dropped as a material: it is the Sharp radius mode, and any monospace font is applied
  globally by the app.
- Depth stays shadowless; the mechanism is pending an example from the owner, who will also update
  Figma (it currently draws Raised and Floating with drop shadows).
- Glass stays as a simple `kind` made of ready-made Tailwind classes applied only when selected,
  keeping components clean. Its look is to be discussed.

## Proposal or Ask

Done when `DESIGN.md` states these as decisions, lists what is still open, and no longer describes
the four materials as the variant model.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:**

- Any component or token implementation.
- `.agents/roles/ui-ux.md`, which still says "materials" (shared policy path, human-owned).

## Validation

- `bun run format`, `bun run lint` and `bun run naming:check` pass.
- Figma node IDs in the doc match the file (read from its Components page).

## Resolution

`DESIGN.md` now has a Figma source section (file key, page and section IDs, observed tokens), the
radius / depth / kind model, the beUI reference and a rewritten open-decisions list.
