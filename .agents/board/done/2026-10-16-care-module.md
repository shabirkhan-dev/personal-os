---
id: pos-28
title: Care module (skin, hair, body) from the Figma Care section
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude
reviewer: human
parent: none
depends_on: [pos-27]
branch: agent/mobile/care-module
worktree: none
scope: ["apps/mobile/src/modules/care/**", "apps/mobile/src/modules/skincare/**", "apps/mobile/src/app/(home)/care/**", "apps/mobile/assets/care/**", "apps/mobile/src/modules/home/**", "apps/mobile/src/modules/food/**", "apps/mobile/src/modules/onboarding/lib/options.ts", "apps/api/src/modules/ai/**", "apps/api/test/**", "apps/docs/content/docs/**"]
allowed_shared: []
created: 2026-10-16
updated: 2026-10-16
---

## What

Skincare becomes Care, from the Figma Care section (408:409):

- Home: streak hero, ask bar with Log it, Routines and Shelf, today's UV with the reapply time,
  Morning and Night routines, Body today, the week's weekly steps and Running low. The empty
  state picks what to work on and the skin type, then builds the routine.
- Routine screen (morning or night) by area with product photos, a guided Start that reads each
  step aloud, and step editing.
- Shelf, Hair and scalp, Body and nails, Weekly check-in (no photos) and Insights.

## Proposal or Ask

- The routine starts with four face products and adds hair, body and weekly steps only for what
  was picked.
- UV from Open-Meteo on the phone (Care's place, else Faith's), cached for the day.
- Water habit reads Food's water log.
- Six record-store collections; the old "skincare" file (routines, products, ticks) moves over
  once. Old skin photos stay on the phone but aren't used: check-ins are words and numbers.
- `POST /ai/care/ask` answers care questions, pointing to a doctor for anything worrying.
- The module id stays `skincare` so onboarding choices and the Home view keep working.

## Validation

- Lint, format and typecheck: clean.
- Mobile tests: 231 pass, including 13 for Care (the old Skincare tests were removed with it).
- API tests: 58 pass.
- `expo export --platform android`: bundles.
