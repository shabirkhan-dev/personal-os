---
id: pos-66
title: Clean slate - no built-in content; templates made by the person with any AI
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: pos-58
depends_on: [pos-64]
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["apps/mobile/src/**", "apps/mobile/e2e/**", "apps/mobile/app-photos/**", "apps/mobile/scripts/gen-bundled-photos.mjs", "packages/ai/src/**", "packages/domain/src/{templates*,faith/content}.ts", "apps/api/src/{app.ts,modules/templates/**,modules/static/**}", "apps/api/test/**", "scripts/upload-app-photos.sh", "README.md", "apps/docs/content/docs/production-roadmap.mdx"]
allowed_shared: []
created: 2026-11-27
updated: 2026-11-27
---

## Done

- Removed every built-in item: the 15 recipes, the 12 programs, the 85-exercise library and its
  ladders, the 45 demo photos and every bundled photo (2 MB), Care's starter shelf and routine
  templates, Fashion's starter pieces, Faith's starter deck, learning paths and challenge list,
  the template packs, and the server's template packs and static photo route.
- Training runs on the person's own exercises: AI programs write the exercises they need, test
  weeks work per exercise, the week stays open until a program is started.
- Templates is "Make your own": nine kinds, each with a copyable prompt (exact file shape and an
  example) for any AI, a paste box, "Make it with my AI" (`templates/make`), and file import;
  programs carry their exercises; new kinds: exercises, flashcards, challenge.
- Faith: write your own challenge and flashcards; import decks.

## Validation

- mobile 369 pass, packages/ai 25, domain templates 3, API 113 against Postgres; typecheck and
  oxlint clean.
- Web export: paste a two-recipe template → preview → add → both in Recipes.
- Live through OpenRouter's free router: "Make it with my AI" made a program (with its
  exercises) and three recipes in the template format.
