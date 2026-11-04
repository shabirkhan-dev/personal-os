---
id: pos-51
title: Health Connect and Apple Health sync, and the assistant's Health tools
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: pos-50
depends_on: [pos-50]
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/src/modules/health/**", "apps/mobile/{app.json,app.config.js,package.json,react-native.config.js}", "bun.lock", "apps/api/src/modules/assistant/**", "apps/api/test/assistant-modules.test.ts", "apps/docs/content/docs/production-roadmap.mdx"]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

Health reads the phone's health store, and the assistant can read and write Health.

## Proposal or Ask

- `health-store.ts` interface with `health-store.android.ts` (react-native-health-connect 4.1.3)
  and `health-store.ios.ts` (@kingstinct/react-native-healthkit 16.2.0, Nitro 0.37.1); none on web.
- Pure mappers (`health-sync-map.ts`) with ids from the store's own record ids or the day, so a
  re-sync never duplicates; only new or changed readings are written.
- `useHealthSync`: per-phone on/off, sync when Health opens and on return to the app (15 min
  apart), Sync now, Choose data, Stop. `PhoneHealthCard` on Health Home.
- Android: Health Connect plugin, nine read permissions, minSdk 26; Apple Health and Nitro kept
  out of the Android build. iOS: HealthKit plugin and usage strings.
- API: `health_view`, `log_health_reading`, `log_medicine_dose`, `add_checkup`, `log_symptom`.

## Validation

- Mobile tests (mappers) and the full API suite (119, incl. 2 new) against a local Postgres 16.
- Android release build with Health Connect linked.
- Apple Health not run: no iOS build in this container.

## Resolution

Landed on `ccr-cdb9b079-navb5d`. Direct device links (Whoop, watches) are on the roadmap.
