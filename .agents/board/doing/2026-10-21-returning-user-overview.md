---
id: pos-32
title: restore a returning account at onboarding and make overview show the real day
type: bug
from: human
to: mobile
priority: high
status: doing
assignee: mobile (claude code)
reviewer: human
parent: none
depends_on: []
branch: agent/mobile/returning-user-and-overview
worktree: main checkout (light mode)
scope: [apps/mobile/src/app, apps/mobile/src/modules/onboarding, apps/mobile/src/modules/home, apps/mobile/src/modules/daily]
allowed_shared: []
created: 2026-10-21
updated: 2026-10-21
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
