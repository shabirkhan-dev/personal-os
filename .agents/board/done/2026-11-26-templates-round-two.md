---
id: pos-61
title: Templates round 2 - share your own, open shared files, packs from the server
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: pos-58
depends_on: [pos-60]
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["packages/domain/src/templates*.ts", "apps/api/src/modules/templates/**", "apps/api/src/app.ts", "apps/api/test/templates.test.ts", "apps/mobile/src/modules/templates/**", "apps/mobile/src/modules/{food,workout,care,faith,finance,daily}/components/*.tsx", "apps/docs/content/docs/production-roadmap.mdx"]
allowed_shared: ["packages/domain/package.json"]
created: 2026-11-26
updated: 2026-11-26
---

## Done

- One template file format (`@personal-os/domain/templates`): kinds recipes, programs,
  care-routine, tasbih, budget, minimum; parse with plain-words errors.
- Share yours: "Share as a template" on a recipe of yours, a program, the Care routine, the
  tasbih sequence, the budget and your own minimum items (share sheet, `.posx.json`, no ids, no
  phone photos).
- Open shared: Templates → Open a template file → preview → add copies; "Shared by …".
- Server packs: `GET /api/v1/templates` (public, cached an hour) with six packs (Ramadan dhikr,
  busy-day minimum, student and family budgets, five-minute routine, protein snacks); shown under
  "New from Personal OS". Every item goes through its module's parser before saving.

## Validation

- domain 20 pass (template files); API template test passes against the app; mobile typecheck
  and oxlint clean.
- Web export with the packs served: list, "Busy-day minimum" preview, add, then the four items
  in Minimum day.
