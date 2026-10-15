---
id: pos-25
title: Fashion module end to end, and location that never hangs
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude
reviewer: human
parent: none
depends_on: [pos-24]
branch: agent/mobile/fashion-module
worktree: none
scope: ["apps/mobile/src/modules/fashion/**", "apps/mobile/src/modules/faith/**", "apps/mobile/src/lib/location/**", "apps/mobile/src/app/(home)/**", "apps/mobile/src/modules/home/**", "apps/mobile/assets/fashion/**", "packages/tokens/src/**", "apps/api/src/modules/ai/**", "apps/api/test/**", "apps/docs/content/docs/**"]
allowed_shared: []
created: 2026-10-16
updated: 2026-10-16
---

## What

1. Location fix (also PR #59). On a real phone, allowing location never produced prayer times
   and the Qibla stuck, with no error. Position and place-name calls could wait forever on
   Android. Each step now has a time limit, the steps go fast-first, location services are
   turned on through the system dialog, and every screen shows the current step and the same
   error.
2. Fashion from the Figma Fashion section (Home page, 300:5903):
   - Home with today's look for the weather; the empty capsule state.
   - Wardrobe, piece detail and Add piece.
   - Outfit plan, wishlist, and watches & scents.
   - Insights.

## Proposal or Ask

- Outfits, the week plan, layer advice, watch rotation and scent picks run on the phone
  (`lib/outfits.ts`).
- Weather from Open-Meteo: free, no key, called from the phone and cached for offline use. It
  uses Fashion's place, or the one Faith found.
- Starter photos come from the Figma "Photo assets" frame and are bundled with the app. The
  person's own photos are kept on the phone.
- New API tasks: `POST /ai/fashion/read-piece` (a line or a product link, including its
  `og:image`) and `POST /ai/fashion/ask`.

## Scope

**Out of scope:** uploading piece photos to R2 (next card), shop integrations.

## Validation

- Lint, format and typecheck: clean.
- Mobile tests: 246 pass, including 13 for Fashion and 4 for location timeouts.
- API tests: 52 pass.
- `expo export --platform android`: bundles, with 23 photos.
