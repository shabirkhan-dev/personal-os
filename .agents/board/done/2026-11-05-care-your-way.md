---
id: pos-55
title: Care your way: empty by default, photos and how-to, templates, design with AI
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: null
depends_on: []
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["packages/domain/src/care/model.ts", "apps/mobile/src/modules/care/**", "apps/mobile/src/app/(home)/care/**", "apps/mobile/src/lib/photos/pick-photo.ts", "apps/mobile/src/modules/home/lib/{module-sections,photo-targets}.ts", "apps/api/src/modules/ai/{care.schema,care.tasks,ai.routes}.ts", "apps/api/src/modules/assistant/tools/care.tools.ts", "apps/api/test/ai.test.ts"]
allowed_shared: []
created: 2026-11-05
updated: 2026-11-05
---

## What

The owner wants photos and "how to apply" notes on Care steps, routines designed by hand or
with AI, and Care (then the whole app) to start empty, with templates only when picked.

## Done

- Steps carry up to four photos and how-to text; products carry how-to and a note; body areas
  are the person's own (`care-areas`).
- Care Home starts empty: Add my own steps, Design it with AI, Start from a template. Nothing is
  built automatically any more (the old "Build my routine" is gone).
- Step editor screen (photos, how to apply, minutes, area, days, product); the i on each step
  shows its photos and how-to. Shelf products take a photo, how-to and note.
- Templates screen: basics, dark spots and tan, dry or sensitive, oily and pores, dandruff,
  thicker hair, daily habits, body areas; each previewed with every step's how-to, then added
  next to what's there or replacing the steps.
- Design with AI (`/ai/care/design-routine`): concerns, skin and notes, using the shelf; a draft
  to review before anything is saved.
- Step and product photos upload to R2.

## Validation

- mobile 334 pass, API 123 pass, typecheck 6/6, oxlint clean.
- Web export: empty start, templates list and preview, Use this, the routine with i, how-to
  sheet, adding a step with instructions, empty body areas, Design screen signed out.
