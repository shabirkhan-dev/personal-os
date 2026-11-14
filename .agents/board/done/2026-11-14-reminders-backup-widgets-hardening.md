---
id: pos-57
title: Reminders that arrive, backup and restore, Android widgets, production hardening
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
scope: ["apps/mobile/**", "apps/api/src/{config,core}/**", "apps/api/src/index.ts", "apps/api/src/app.ts", "apps/api/test/hardening.test.ts", "apps/web/src/**", "packages/domain/src/{legal,error-report}*.ts", ".github/workflows/cd.yml", "apps/docs/content/docs/{deploy,production-roadmap}.mdx"]
allowed_shared: ["packages/domain/package.json", "apps/web/package.json", "apps/web/next.config.ts"]
created: 2026-11-14
updated: 2026-11-14
---

## What

The owner asked for home-screen widgets, export/backup of all data with import, reminders that
are never missed, and production hardening.

## Done

- Reminders: one engine (`modules/reminders`) for prayers, daily alarms, medicines, Care
  routines, water, setup reminders and assistant nudges. Android alarm-clock delivery with the
  exact-alarm permission, Snooze on every reminder, Taken and an "ask again" follow-up for
  medicines, Log a glass for water; planned from the record store on launch, on return to the
  app, on data changes and by an expo-background-task top-up, so no screen has to be open.
  Settings → Reminders: permission / exact alarm / battery check, test reminder, what's coming,
  Care and water times, follow-up and snooze length.
- Backup and restore (Settings → Backup and restore): one file with every record, document,
  setup answers and optional photos; save to a folder (SAF) or share; daily automatic backup into
  a picked folder keeping seven; restore with a preview, merge or replace (one transaction,
  synced like any edit). Replaces the old text-only export.
- Android widgets (react-native-android-widget): Today, Water (+250 ml), Tasbih (tap to count),
  Money left; buttons run in the background; refreshed after changes.
- Hardening: dependency-free crash reporter in Sentry's envelope format (`SENTRY_DSN` on the
  Worker, `EXPO_PUBLIC_SENTRY_DSN` in the app; off without them), `Cache-Control: no-store` on API
  answers, CD with migrations and a smoke check behind the quality gate, privacy policy and terms
  in the app and at `/privacy` and `/terms`, staging and branch-protection steps in the deploy docs.

## Validation

- mobile `bun test`: 352 pass, 0 fail; domain: 17 pass; API `vitest`: 125 pass (local Postgres).
- `bun run typecheck` 6/6, `bunx oxlint` clean, architecture and naming checks pass.
- `apps/web` builds with `/privacy` and `/terms`.
- Web export walked: Settings rows, Reminders (water times, follow-up, snooze), Backup, Privacy.
- Not verifiable here: notifications, alarms, widgets and SAF folders need a device (APK sent).
