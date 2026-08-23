---
from: human
to: backend
priority: high
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Restrict billing redirect URLs to trusted origins

## Context

Checkout `successUrl`/`cancelUrl` and portal `returnUrl` are accepted as
arbitrary valid URLs and passed to the payment provider. A syntactically valid
external URL is still an untrusted redirect target and can be supplied by an
authenticated caller.

Relevant code: `apps/nest-api/src/modules/billing/billing.dto.ts` and
`apps/nest-api/src/modules/billing/billing.service.ts`.

## Requested outcome

Use server-owned defaults or validate requested URLs against an explicit
allowlist of the configured web origin and approved mobile deep-link origins.
Reject disallowed origins with the standard validation envelope; never accept
an arbitrary external redirect merely because it passes URL parsing.

## Definition of done

- Web and mobile checkout flows continue to work with approved destinations.
- External and malformed redirect origins are rejected before provider calls.
- Tests cover every checkout/portal redirect field and both allowed clients.
- The allowlist configuration and behavior are documented for frontend/mobile
  consumers.

## Resolution

(open)
