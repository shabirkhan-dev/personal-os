---
from: human
to: mobile
priority: normal
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Make avatar delivery reliable and privacy-conscious

## Context

When a user has no uploaded avatar, the mobile app requests images from
`avatar.vercel.sh`. Template selection uses public `api.dicebear.com` URLs and
stores those external URLs as profile data. This creates third-party requests
on identity surfaces, couples profile rendering to vendor availability, and
does not give the app control over image policy or caching.

Relevant code: `src/components/ui/os-header.tsx`,
`src/modules/users/components/profile-screen.tsx`, and
`src/modules/users/lib/avatar-templates.ts`.

## Requested outcome

Choose a first-party/CDN or curated local asset strategy for generated avatars,
define an explicit fallback/cache policy, and avoid persisting arbitrary vendor
URLs as the user’s canonical identity media.

## Definition of done

- Avatar rendering remains usable offline or when the image vendor is down.
- Profile requests do not leak usernames to unnecessary third parties.
- Uploaded/template media has an explicit ownership, cache, and moderation
  policy.
- Native and web surfaces use the same resolved media contract.

## Resolution

(open)
