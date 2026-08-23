---
from: human
to: backend
priority: high
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Make rate limiting distributed and endpoint-aware

## Context

`ThrottlerModule` uses the default in-memory store with one global 100-request
bucket, while route limits are also applied through the global guard. Multiple
API replicas can therefore reset limits independently, and auth protection is
primarily IP-based rather than identity/email-aware. The same global bucket can
also throttle bursts of signed payment webhooks.

Relevant code: `apps/nest-api/src/app.module.ts` and the auth/billing
controllers' `@Throttle` declarations.

## Requested outcome

Use a shared production store or an explicitly documented single-instance
constraint. Define separate buckets for authentication, normal API traffic,
health, and signed webhook ingestion; add identity/email-aware protection for
credential attacks without leaking account existence.

## Definition of done

- Limits behave consistently across multiple API instances.
- Brute-force, webhook-burst, and normal-user scenarios have separate tests.
- Proxy/IP extraction is validated for the deployed hosting topology.

## Resolution

(open)
