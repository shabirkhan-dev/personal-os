---
from: human
to: backend
priority: high
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Harden and make avatar storage durable

## Context

Profile updates accept any `z.url()` value, including non-HTTP schemes, and
Google profile pictures are stored as remote URLs. Uploaded avatar URLs are
constructed from forwarded host/protocol headers without checking that the
proxy is trusted. Uploaded files are MIME-checked but not decoded or magic-byte
validated, and the local `uploads` directory is ephemeral in a multi-instance
deployment with no replacement cleanup.

Relevant code: `apps/nest-api/src/modules/profiles/profiles.dto.ts`,
`avatar-upload.ts`, `avatar-storage.service.ts`, and
`social-auth.service.ts`.

## Requested outcome

Use server-managed avatar references or an explicit HTTPS host allowlist,
derive public origin from trusted configuration/proxy metadata, validate image
content rather than only client MIME, and move files to durable object storage
with cleanup/versioning and cache headers.

## Definition of done

- `javascript:`, `data:`, `file:`, arbitrary hosts, and spoofed forwarded headers
  cannot become stored avatar sources.
- Invalid/polyglot image uploads are rejected and size limits apply before disk
  exhaustion.
- Replacing/deleting an avatar does not leave unbounded orphan files.
- Multi-instance/restart behavior and the profile API contract are tested.

## Resolution

(open)
