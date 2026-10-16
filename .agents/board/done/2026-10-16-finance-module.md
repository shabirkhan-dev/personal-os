---
id: pos-31
title: Finance in runway mode from the Figma Finance section
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude
reviewer: human
parent: none
depends_on: [pos-30]
branch: agent/mobile/finance-module
worktree: none
scope: ["apps/mobile/src/modules/finance/**", "apps/mobile/src/app/(home)/finance/**", "apps/mobile/src/modules/faith/**", "apps/mobile/src/modules/food/**", "apps/mobile/src/modules/home/**", "apps/api/src/modules/ai/**", "apps/api/test/**", "apps/docs/content/docs/**"]
allowed_shared: []
created: 2026-10-16
updated: 2026-10-16
---

## What

Finance from the Figma Finance section (424:409):

- Home: money now and days of runway as the hero, ask bar with Spent / Scan / Budget, runway
  bars, the month's spend, upcoming bills with Pay, recent entries and the after-the-job goal.
- Empty state: three numbers (money now, a month's cost, income) and Start runway mode.
- Runway (what-ifs, the minimum), Log spending, Budget (move money, zakat from Faith), Income and
  halal (interest kept apart), History and Insights.

## Proposal or Ask

- Record store collections `finance-settings`, `finance-entries`, `finance-bills`,
  `finance-sources`; the old "finance" file moves over once.
- The phone splits spending lines; `POST /ai/finance/read` reads what it can't, and
  `POST /ai/finance/ask` answers questions and checks offers.
- `useFinanceSummary()` keeps its shape for Overview, Career and Daily life.

## Validation

- Lint, format and typecheck: clean.
- Mobile tests: 214 pass (old Finance tests removed with their code; 15 new).
- API tests: 67 pass.
- `expo export --platform android`: bundles.
