---
id: pos-18
title: Onboarding works end to end (real voice, saved progress, reminders, OS Card)
type: feature
from: human
to: mobile
priority: high
status: done
assignee: claude-code
reviewer: human
parent: none
depends_on: []
branch: ccr-f7a44e55-46aj0i
worktree: none
scope: ["apps/mobile/**", "bun.lock"]
allowed_shared: ["bun.lock"]
created: 2026-10-13
updated: 2026-10-14
---

## What

Onboarding looked finished but did nothing real: the voice step played a fixed transcript, nothing
was saved until the last button, permissions were never asked, reminders never scheduled, Connect
showed fake "Connected" rows, Building was a timer and the member card always said "OS · 0001".
The Figma file added the OS Card (176:1070) to Building and All set.

## Resolution

- Progress: answers and the current step save to SecureStore on every change (300 ms debounce);
  reopening the app resumes on that step. Back works after Skip or a resume.
- Voice: live on-device speech-to-text (`expo-speech-recognition`), mic permission, a waveform
  from the real input level and a real timer. `lib/parse-intro.ts` reads name, age, height,
  weight, wake/sleep, work style/hours, goals and gender from what was said; missing items are
  "Tap to add" chips (gender inline, the rest jump to their step). Builds without the native
  module show "Type instead" instead of crashing.
- Reminders: `expo-notifications`; "Allow and continue" asks for permission, Building schedules
  the morning plan, evening check-in and workout nudges from the person's day. "Hey OS" is
  marked Soon.
- Connect: only the microphone is live (real permission, Settings when blocked); Health,
  Calendar, Smartwatch and Bank SMS say Soon. Defaults are now off.
- OS Card on Building and All set: name, member since, height/weight in the chosen units, BMI
  band, module dots, a stable four-digit card number saved on the device. Share my card.
- Validation: About you needs a name; Goals only re-recommends modules when the goals changed.

Validation: typecheck, oxlint 0 warnings, mobile tests 57 pass, architecture and naming checks,
`expo config --type prebuild` resolves both plugins (RECORD_AUDIO, speech usage strings).
`shellcheck` is not installed in this container, so `scripts:lint` could not run (no shell
changes).

Needs a new EAS build: two native modules were added. Not verified on a device from here.
