---
id: pos-50
title: Health module, readings, readiness, medicines, checkups, labs, symptoms, profile
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: []
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["packages/domain/src/health/**", "packages/domain/package.json", "apps/mobile/src/modules/health/**", "apps/mobile/src/app/(home)/health/**", "apps/mobile/src/modules/{home,onboarding}/**", "apps/mobile/src/app/(home)/{index,_layout}.tsx", "apps/api/src/modules/onboarding/onboarding.schema.ts", "DESIGN.md", "apps/docs/content/docs/production-roadmap.mdx"]
allowed_shared: []
created: 2026-11-04
updated: 2026-11-04
---

## What

A Health module for the small factors: blood pressure and other readings, checkups, medicines,
lab results, symptoms and a health profile. Apart from Care, which stays grooming.

## Proposal or Ask

- Domain (`@personal-os/domain/health`): readings, checkups, labs, medicines, dose logs,
  symptoms and the profile, with tolerant parsers; bands (AHA blood pressure, ADA sugar, oxygen,
  temperature), readiness against a 30-day baseline, repeating checkups, today's doses,
  adherence, refills, lab status and a short-sleep symptom link.
- App: Health Home (ask bar for "bp 120/80", "took metformin", "headache"; readiness; a vitals
  grid; today's doses with Take and Skip; the next checkup), Vitals, Medicines (daily
  reminders), Checkups, Lab results, Symptoms, Health profile and Insights.
- Registered as a module everywhere, including the API's onboarding module list.
- PR 2 adds Health Connect and Apple Health sync and the assistant's Health tools.

## Validation

- Domain: 7 tests. Mobile: 321 pass (8 new). Typecheck and oxlint clean.
- Web export walked: Health Home, BP from the ask bar, Vitals, the medicine sheet, the profile.

## Resolution

Landed on `ccr-cdb9b079-navb5d`.
