---
id: pos-24
title: Faith module end to end, voice in and out, Talk to OS
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude
reviewer: human
parent: none
depends_on: [pos-21, pos-22]
branch: agent/mobile/faith-module
worktree: none
scope: ["apps/mobile/src/modules/faith/**", "apps/mobile/src/app/(home)/**", "apps/mobile/src/lib/voice/**", "apps/mobile/src/lib/use-now.ts", "apps/mobile/src/lib/flashcards/**", "apps/mobile/src/components/module-ui.tsx", "apps/mobile/src/components/module-screen.tsx", "apps/mobile/src/modules/home/**", "apps/mobile/src/modules/career/**", "apps/mobile/src/modules/onboarding/**", "apps/mobile/src/modules/food/components/say-it-sheet.tsx", "apps/mobile/src/theme/fonts.ts", "apps/mobile/app.json", "apps/mobile/package.json", "packages/tokens/src/typography.ts", "apps/api/src/modules/ai/**", "apps/api/src/modules/onboarding/onboarding.schema.ts", "apps/api/test/ai.test.ts", "apps/docs/content/docs/**", "DESIGN.md"]
allowed_shared: ["bun.lock"]
created: 2026-10-15
updated: 2026-10-15
---

## What

Build the Faith module from the Figma Faith section (Home page, 266:2299): Home with the Sky
header, today's prayers, Never miss twice, consistency, the Moment card (ayah of the day, waking
and bedtime duas), recitation and Grow; Reminders and setup; Qibla (and aligned); Tasbih; Zakat;
Grow; Quran recitation; Insights; flashcards. Add voice in and out on the phone behind a
replaceable layer, and a "Talk to OS" entry that opens straight into listening.

## Why / Context

Faith is the next module after Career. The owner asked for no stuck screens and lively loading
for AI-only output, speech where it helps, and a way to wake the OS by voice.

## Proposal or Ask

- Prayer times on the phone with adhan (location via expo-location, or typed times), so times,
  the next prayer, reminders and the Qibla work offline. Default prayers Fajr, Maghrib, Isha.
- Everything stored in the record store (synced). Prayer reminders as date notifications for the
  next six days, rescheduled when Home opens or settings change.
- `POST /ai/faith/ask` for questions, run as a background AI job with the working card.
- Voice: `src/lib/voice` (`engines.ts` picks the engines; `useSpeaker` reads parts in turn).
- Talk to OS at `personalos://listen`; the always-on "Hey OS" wake word is a later card (needs an
  Android foreground service and an on-device wake-word model; iOS does not allow it).

## Scope

**In scope:** see `scope`.

**Out of scope:** the background wake word, RAG/Vectorize, uploading files to Grow (links only).

## Validation

- `bun run lint`, `bun run format`, `bun run typecheck`: clean.
- `bun run test`: mobile 229 pass (17 new Faith tests, 2 for line routing); API 49 pass against a
  local Postgres (2 new Faith AI tests).
- `bun run architecture:check`: passed. `expo export --platform android`: bundles (Amiri Quran
  font included).

## Resolution

Shipped on `agent/mobile/faith-module`, stacked on PR #56.
