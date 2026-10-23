---
id: pos-32
title: restore a returning account at onboarding and make overview show the real day
type: bug
from: human
to: mobile
priority: high
status: done
assignee: mobile (claude code)
reviewer: human
parent: none
depends_on: []
branch: agent/mobile/returning-user-and-overview
worktree: main checkout (light mode)
scope: [apps/mobile/src/app, apps/mobile/src/modules/onboarding, apps/mobile/src/modules/home, apps/mobile/src/modules/daily]
allowed_shared: []
created: 2026-10-21
updated: 2026-10-23
---

## What

Someone who already has an account and reinstalls the app (or gets a new phone) is sent through
the whole onboarding, and signing in at step 17 overwrites the plan saved on the account. The
Overview also shows the static onboarding plan instead of the live Daily agenda, its ask bar only
shows an alert, and its bell is a fake "all caught up" alert.

## Why / Context

- `modules/onboarding/store/onboarding-progress.ts`: "completed" is a SecureStore flag, wiped on
  reinstall; nothing asks the account.
- `markCompleted` stamps the answers with the current time, so `useOnboardingSync` sees the
  device as newer and `PUT`s over the account's answers (`backend-api.mdx`, onboarding section).
- `app/(home)/index.tsx`: Upcoming comes from `todayItems` (onboarding plan), not
  `useDailyToday`; `AskBar.onSubmit` is `Alert.alert("Pick a module")`.
- `daily-home-view.tsx`: `LISTENERS` predates finance, workout and wishlist reading the ask
  inbox, so lines for them are dropped.

## Proposal or Ask

1. "I already have an account" on the welcome screens → email sign-in → `GET
   /users/me/onboarding`; a saved plan is restored with its server `updatedAt` and the app opens;
   no plan continues setup signed in; errors offer retry.
2. Step 17: when the account already has a plan, ask "use saved plan" or "replace it".
3. Overview: Upcoming and a minimum-day card from the live Daily data; the ask bar routes the line
   to its module; the bell becomes the morning brief.
4. Daily forwards every routed line to its module.

## Scope

**In scope:** the paths in `scope`.

**Out of scope:** API changes, other modules' Homes.

## Validation

- `bun --cwd=apps/mobile run lint`, `typecheck`, `test`
- Unit tests for the restore decision and the agenda → upcoming mapping
- Device check of the reinstall path on a preview build

## Resolution

Landed on `agent/mobile/returning-user-and-overview` (commit 9a51651):

- `app/(onboarding)/welcome-back.tsx`, `hooks/use-saved-plan.ts`, `restoreSaved` in
  `onboarding-progress.ts`: "I already have an account" on the welcome frames restores the
  account's plan with its server `updatedAt`; no plan continues setup; errors offer retry.
- `app/(onboarding)/sign-in.tsx`: an account with a plan is asked "use my saved plan" or
  "replace it with this plan".
- `daily/components/daily-overview.tsx`, `daily/lib/overview.ts` (+ test): Overview's Upcoming and
  minimum-day card come from the live Daily agenda; the Overview ask bar routes lines; the bell is
  the morning brief (Talk to OS without Daily life).
- `daily-home-view.tsx`: every routed line is forwarded to its module.

Validation run: `bun --cwd=apps/mobile run lint` (0 errors), `typecheck` (clean), `test`
(245 pass, 0 fail), `bun run architecture:check` (passed), pre-commit hooks green. Preview APK
built on EAS (build 4c63c8b5). Device check on the owner's Galaxy S23 Ultra is pending with the
owner; nothing was verified on a device by the agent.

Follow-ups not done: the "onboarding finished" flag is still device-only, and resetting
onboarding from Profile while signed in does not ask about the saved plan.
