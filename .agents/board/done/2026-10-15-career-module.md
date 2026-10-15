---
id: pos-21
title: Career module end to end
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude
reviewer: human
parent: none
depends_on: [pos-20]
branch: agent/mobile/offline-sync-career
worktree: none
scope: ["apps/mobile/src/modules/career/**", "apps/mobile/src/app/(home)/**", "apps/mobile/src/components/ui/sheet.tsx", "apps/mobile/src/modules/home/**", "apps/mobile/src/modules/onboarding/lib/options.ts", "apps/nest-api/src/modules/ai/**", "apps/nest-api/src/modules/onboarding/onboarding.dto.ts", "apps/ai-api/**", "apps/docs/content/docs/backend-api.mdx"]
allowed_shared: []
created: 2026-10-15
updated: 2026-10-15
---

## What

Build the Career module from the Figma Career lane: Career Home (runway, pipeline, follow-ups),
add application (paste a link, AI fills it in, halal check, manual fallback), applications by
stage, application detail (timeline, contact, notes), AI nudge draft, interview prep, flashcards
and the daily skill block.

## Why / Context

Finding a job is the owner's top priority, and Career is the next module after the Homes.
Figma: Kit v2 App Flow, "Lane / 9 · Career" (296:7348); screen frames from the owner's file.

## Proposal or Ask

- Mobile `modules/career` on the pos-20 record store (works offline; AI features need a
  connection and say so).
- AI tasks in `apps/ai-api` (read job link, draft nudge, interview prep) behind one Nest proxy
  route; cloud models only.
- `career` added as a module id in the app and the onboarding API.

Done when every screen in the lane works on real data, offline and online, with tests for the
pure logic and the AI tasks.

## Scope

**In scope:** see `scope`.

**Out of scope:** Faith module (next card), job-board integrations, sending email from the app.

## Validation

- mobile lint, typecheck, test; ai-api ruff + pytest; nest lint, typecheck, tests
- screens checked against the Figma frames

## Resolution

Shipped in eef4e8f on `agent/mobile/offline-sync-career`, all 15 Career frames (Figma page
"Career", 264:2619) built.

Changed:
- `apps/mobile/src/modules/career/**`, routes under `apps/mobile/src/app/(home)/career/`, `career`
  module id, hero label press in the shared header, `footer` prop on the shared Sheet
- `apps/ai-api`: career tasks, schemas, safe page reader, tests
- `apps/nest-api/src/modules/ai/**`: `POST /ai/career/:task`; onboarding accepts `career`

Validation:
- mobile career lib tests (17) pass; lint 0; typecheck clean; android bundle exports
- ai-api pytest 14 pass, ruff clean; nest unit 27 pass (AI client error mapping)
- live: sign-in → parse-line, interview-prep, private-URL refusal (422), unknown task (400)

Deviations from Figma, on purpose:
- Interview prep's primary button is "Review flashcards"; the mock-interview flow has no design yet.
- Skill path's third stat is hours this month; an "explain score" needs a scoring feature first.
- AI tips on module screens are rule-based from the data (no extra model call).

Not verified here: rendering on a device (needs a new dev build for expo-sqlite and
expo-clipboard), and reading live job sites (the sandbox blocks outside sites).
