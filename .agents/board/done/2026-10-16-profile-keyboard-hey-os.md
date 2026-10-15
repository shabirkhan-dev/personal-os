---
id: pos-26
title: Profile photo and name, keyboard-safe inputs, Hey OS while the app is open
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude
reviewer: human
parent: none
depends_on: [pos-25]
branch: agent/mobile/profile-keyboard-wake
worktree: none
scope: ["apps/mobile/src/modules/profile/**", "apps/mobile/src/modules/onboarding/components/**", "apps/mobile/src/app/**", "apps/mobile/src/components/**", "apps/mobile/src/lib/**", "apps/mobile/src/modules/home/**", "apps/mobile/src/modules/auth/context/**", "apps/mobile/plugins/**", "apps/mobile/app.json", "apps/docs/content/docs/production-roadmap.mdx"]
allowed_shared: []
created: 2026-10-16
updated: 2026-10-16
---

## What

1. Profile photo and name.
   - Choose a photo from the gallery or take one. It is cropped square.
   - The photo shows everywhere at once and works offline.
   - It uploads to R2 when the person is signed in, and is retried later if that fails.
   - The name is saved to the account.
2. Fields never hide behind the keyboard: module screens, Today, Profile, onboarding and every
   sheet.
3. "Hey OS" while the app is open, with a toggle in Profile, plus a Talk to OS launcher shortcut
   on Android.

## Notes

- Android draws edge to edge, so the window no longer shrinks for the keyboard.
  `KeyboardAwareScrollView` and `Sheet` measure how much the keyboard actually covers. They pad
  by that amount and scroll the focused field into view. This needs no new native code.
- The phone has one speech recogniser. `speech-owner` makes whoever started it last the owner,
  and the wake listener steps aside for any other mic.
- Wake-word detection while the app is closed is out of scope. It needs a foreground service and
  an on-device wake-word engine. iOS does not allow always-on listening.

## Validation

- Lint, format and typecheck: clean.
- Mobile tests: 249 pass, including 3 for the wake phrase.
- A throwaway `expo prebuild` shows the shortcut XML, the manifest meta-data and the string
  labels.
- `expo export --platform android`: bundles.
