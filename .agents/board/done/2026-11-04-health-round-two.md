---
id: pos-52
title: Health round two: sync fix, supplements, photos, records and widgets
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: pos-50
depends_on: [pos-51]
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["packages/domain/src/health/**", "apps/mobile/src/modules/health/**", "apps/mobile/src/app/(home)/health/**", "apps/mobile/src/modules/home/lib/{module-sections,photo-targets}.ts", "apps/mobile/src/modules/home/components/module-picker.tsx", "apps/mobile/src/modules/assistant/components/assistant-chat.tsx", "apps/mobile/src/components/ui/keyboard-aware-scroll-view.tsx", "apps/mobile/app.json", "apps/api/src/modules/assistant/tools/health.tools.ts", "apps/docs/content/docs/production-roadmap.mdx"]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

The owner connected Health Connect and nothing came through. They also saw a scrollbar on Android,
and asked for a fuller Health: medicines vs supplements, photos, better widgets.

## Done

- Sync bug: Health Connect's records don't carry their type, so every instantaneous record
  (BP, heart, oxygen, weight…) was dropped. The type now comes from the request. Each type is
  read on its own (one failure no longer hides the rest), all pages are read, all-day heart rate
  is added (daily average, `READ_HEART_RATE`), the window is 30 days, and the card says what the
  last sync found or where to turn sharing on (Samsung Health › Settings › Health Connect).
- Scroll indicators hidden on every vertical scroll view.
- Medicines carry type (medicine/supplement), form, purpose, food timing and a pack photo.
- Records: photos of prescriptions, reports, scans, vaccine cards, insurance.
- Home: Today strip (sleep, steps, heart vs goals, thin bars), 7-day trend bars on vitals, a
  section grid; profile has step and sleep goals.

## Validation

- `bun test` mobile 325 pass, domain 13 pass; typecheck 6/6; oxlint 0; architecture and naming OK.
- Web export walked: Health home, add-a-supplement sheet, Records.
- Not checked on a device: the sync fix itself (needs the owner's phone).
