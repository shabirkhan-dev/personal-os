---
from: human
to: backend
priority: high
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Make billing webhook application idempotent and ordered

## Context

`BillingService` parses an event containing an idempotency key, but
`BillingRepository.upsertFromWebhook` does not persist or check that key. The
repository also updates a subscription by provider subscription ID without an
event ordering guard or a transaction around the read/update path. Retries can
create duplicate rows when no provider subscription ID is present, and a late
older event can overwrite newer subscription state.

Relevant code: `apps/nest-api/src/modules/billing/billing.service.ts` and
`apps/nest-api/src/modules/billing/billing.repository.ts`.

## Requested outcome

Persist provider event IDs with a unique constraint, apply each event once,
and reject or ignore stale events using provider event ordering/timestamps.
Apply the event ledger and subscription mutation atomically, while preserving
provider-specific signature verification and safe webhook acknowledgements.

## Definition of done

- Duplicate delivery is harmless and cannot create duplicate subscriptions.
- An older event cannot move a subscription backward.
- Concurrent duplicate deliveries are safe at the database level.
- Tests cover duplicate, out-of-order, missing-subscription-ID, and concurrent
  delivery cases.
- Any schema/API change is documented in `apps/docs/content/docs/backend-api.mdx`.

## Resolution

(open)
