---
from: human
to: mobile
priority: high
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Keep cleartext traffic out of production mobile builds

## Context

`apps/mobile/app.json` enables `android.usesCleartextTraffic: true` globally.
That permits HTTP traffic in production Android builds and can hide accidental
non-HTTPS API configuration.

## Requested outcome

Scope cleartext traffic to local development only, or remove it and use HTTPS
for every non-local environment. Add build/config validation so a production
profile cannot ship with cleartext enabled or an HTTP API base URL.

## Definition of done

- Development can still target an explicitly configured local HTTP server.
- Preview/production builds enforce HTTPS and disable cleartext traffic.
- CI or an automated config test fails on an unsafe production combination.

## Resolution

(open)
