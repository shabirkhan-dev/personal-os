---
from: human
to: mobile
priority: high
status: open
assignee: none
created: 2026-08-24
updated: 2026-08-24
---

# Complete the authenticated finance client integration

## Context

The new `src/modules/finance` service calls every finance endpoint without an
`accessToken`, while the backend contract marks all finance routes as auth
required. Its query and mutation hooks also do not read auth state or disable
until auth bootstrap/session identity is ready. These calls will therefore
receive 401s and can run during the unauthenticated root-route window.

`SpendingWidget` additionally falls back to hardcoded values whenever summary
data is absent, making loading/error states look like real financial data.

## Requested outcome

Thread the current access token through finance repositories/services, gate
queries and mutations on authenticated state, and render explicit loading,
empty, and error states without fabricated account values.

## Definition of done

- Transactions, summaries, and budgets send the authenticated bearer token.
- Finance requests do not run before auth bootstrap completes or after logout.
- API failures cannot silently display demo balances or transactions.
- Create/delete/budget mutations show recovery feedback and invalidate the
  correct user-scoped queries.
- Tests cover unauthenticated, expired-token, empty, loading, and error states.

## Resolution

(open)
