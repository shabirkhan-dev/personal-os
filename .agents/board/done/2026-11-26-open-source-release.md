---
id: pos-63
title: Open-source release - README, docs and the APK on GitHub Releases
type: chore
from: human
to: devops
priority: high
status: done
assignee: claude-code
reviewer: human
parent: pos-58
depends_on: [pos-62]
branch: ccr-cdb9b079-navb5d
worktree: none
scope: ["README.md", "PROJECT.md", "apps/docs/content/docs/*.mdx", ".github/workflows/release.yml", ".github/workflows/e2e.yml", "apps/mobile/app.json"]
allowed_shared: []
created: 2026-11-26
updated: 2026-11-26
---

## Done

- `Release` workflow: on a `v*` tag (or by hand with a tag), builds the arm64 APK, attaches it
  and a SHA-256 file to a GitHub release with install steps; suffixed tags are pre-releases.
- README: Download section, how it works (starts empty, templates, private, reminders, backup,
  search and your week, widgets), module table with Health, build and tests sections,
  Contributing.
- Docs: Deploy → APK on GitHub Releases, Quick start callout, roadmap entries; PROJECT.md
  packages and workflows. App version 0.7.0.

## Validation

- Docs site builds (`bun --cwd=apps/docs run build`, 55 pages).
- The workflow is checked once it runs on `main` (Actions → Release → v0.7.0).
