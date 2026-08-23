---
from: human
to: backend
priority: normal
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Expose accurate billing provider readiness

## Context

`listConfiguredProviders` reports a provider when it has either a provider
client or provider keys, but webhook readiness requires a webhook secret as
well. `requireProvider` only checks checkout keys. The API can therefore
advertise a provider whose webhook path will return `503`, or accept checkout
configuration that cannot reconcile subscriptions.

Relevant code: `apps/nest-api/src/modules/billing/billing.service.ts` and the
Stripe/Razorpay providers.

## Requested outcome

Model checkout, portal, webhook, and price-plan capabilities separately and
make each endpoint enforce the capability it needs. Return a truthful provider
status without exposing secrets.

## Definition of done

- Provider discovery matches the capabilities available at runtime.
- Missing secret/price combinations fail at startup or with stable errors before
  an external checkout is created.
- Tests cover partial Stripe and Razorpay configurations.
- The status board accurately describes the supported provider matrix.

## Resolution

(open)
