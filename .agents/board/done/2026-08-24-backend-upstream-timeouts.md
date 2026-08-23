---
from: human
to: backend
priority: normal
status: done
assignee: backend
created: 2026-08-24
updated: 2026-08-24
---

# Bound external provider calls

## Context

The Resend and AI clients call `fetch` without an `AbortSignal` timeout. A
stalled upstream can hold an auth or AI request open indefinitely, consume API
resources, and cause clients to retry duplicate operations. Provider SDK calls
also need explicit timeout/error policy at the billing boundary.

Relevant code: `apps/nest-api/src/modules/email/email.service.ts`,
`apps/nest-api/src/modules/ai/ai.client.ts`, and billing providers.

## Requested outcome

Define bounded connect/request timeouts, cancellation, and stable timeout
mapping for every external call. Add bounded retries only where the operation
is safe or idempotency is guaranteed; do not retry email or checkout blindly.

## Definition of done

- A hung upstream cannot hold a request past the configured deadline.
- Timeout, abort, and provider errors preserve the API error envelope.
- Tests cover timeout behavior and duplicate-safety for retried operations.

## Resolution

Added `common/http/fetch-with-timeout.ts` (AbortController deadline → stable
`UpstreamTimeoutError`) and wired it into `EmailService` (Resend) and `AiClient`
(assist + health). Stripe gets a native `timeout` plus `maxNetworkRetries: 0`
(no blind retries). Razorpay's SDK exposes no timeout option, so its checkout
call is wrapped with `withTimeout()` (caller released on deadline; underlying
request is not cancellable — documented limitation). New config
`EXTERNAL_REQUEST_TIMEOUT_MS` (default 10s). Timeouts map to stable 503 codes
(`EMAIL_PROVIDER_TIMEOUT`, `EMAIL_PROVIDER_UNREACHABLE`, `AI_UNAVAILABLE`,
`BILLING_PROVIDER_TIMEOUT`) that preserve the error envelope. Tests:
`fetch-with-timeout.spec.ts` (timeout, abort detection, pass-through) + updated
email spec.
