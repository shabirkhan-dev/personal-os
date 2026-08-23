---
from: human
to: mobile
priority: normal
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Remove Expo-starter residue and align Personal OS branding

## Context

The mobile app still contains create-expo-app documentation and assets: the
README instructs `npm`/`npx`, references the `app` directory and reset template,
and names the project Expo starter. Runtime copy still says Starter and
`school.edu`; unused Expo tabs/components/assets include `/explore`, Expo
logos/badges, tutorial images, and themed starter primitives. The iOS icon and
photo permission text also still reference Expo/Starter. `app.json` begins with
an UTF-8 BOM, which adds avoidable config/tooling drift.

## Requested outcome

Make the app consistently Personal OS, delete or isolate unused starter routes,
components, and assets, and update mobile setup documentation to the monorepo’s
Bun/Expo workflow.

## Definition of done

- User-facing copy, app metadata, icons, permissions, and docs use the approved
  Personal OS identity.
- No generated typed route references a nonexistent screen.
- Dead starter files are removed or explicitly documented as tooling fixtures.
- Config files are normalized to the repository encoding/format conventions.

## Resolution

(open)
