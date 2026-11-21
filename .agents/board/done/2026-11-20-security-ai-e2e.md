---
id: pos-59
title: App lock and encrypted data, Design with AI for budget and day, Maestro E2E in CI
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: null
depends_on: [pos-58]
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/**", "apps/api/src/modules/ai/**", "apps/api/test/ai.test.ts", ".github/workflows/e2e.yml", "apps/docs/content/docs/production-roadmap.mdx"]
allowed_shared: []
created: 2026-11-20
updated: 2026-11-20
---

## What

The owner picked: device-level checks for what CI can't see (1), app lock and encrypted data (2),
and Design with AI in more modules (7).

## Done

- Encryption: SQLCipher (`expo-sqlite` `useSQLCipher`), 32-byte key in SecureStore; a plain
  database is exported into an encrypted one once (`sqlcipher_export`, user_version kept), and a
  file that doesn't open with the key is moved aside instead of crashing. Android `allowBackup`
  off, so a restored file never meets a missing key.
- App lock (`expo-local-authentication`): Settings → Security, lock every time / after 1, 5 or
  15 minutes, privacy cover while switching apps, "Hide in recent apps" (FLAG_SECURE through
  `expo-screen-capture`). The passcode screen doesn't re-lock the app it unlocks.
- Design with AI: `POST /ai/finance/design-budget` and `POST /ai/daily/design-day` (mock and
  trimmed model answers, tests), a budget sheet on Budget and a "Design my day" sheet on Plan the
  day; AI entries in the Training, Finance, Food and Daily menus.
- E2E: five Maestro flows (first launch, templates, reminders, backup, security, the last one
  asserting the database is encrypted on the device) and an emulator workflow on main, nightly,
  by hand and on PRs that change the flows.

## Validation

- mobile 353 pass; API 129 pass (4 new); typecheck 6/6; oxlint, architecture and naming clean.
- Web export walked: Security, budget AI sheet, day AI sheet (signed out).
- E2E and encryption need a device: the E2E workflow on this PR is the check.
