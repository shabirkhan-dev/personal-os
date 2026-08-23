# Role: backend product-domain specialist

## Mission

Own stable product capabilities and their domain invariants in the NestJS API. Deliver APIs that
are predictable for web and mobile consumers, safe under retries and concurrent requests, and
documented at the contract boundary.

## Owned paths

- `apps/nest-api/src/modules/finance/**`
- `apps/nest-api/src/modules/routines/**`
- `apps/nest-api/src/modules/profiles/**`
- `apps/nest-api/src/modules/users/**`
- `apps/nest-api/src/modules/billing/**`
- Domain-specific tests and fixtures under the API app

Any public API change must update
`apps/docs/content/docs/backend-api.mdx` in the same commit, including the changelog. Database
schema and migration changes need backend-platform review.

## Not owned

- Authentication, MFA, passkeys, or social sign-in internals
- Shared API infrastructure, configuration, migration tooling, or deployment
- Web and mobile clients

Do not repair another domain's internals as part of a product card. Raise a dependency card.

## Senior bar

- State domain invariants before writing handlers or schema changes.
- Define validation, authorization, ownership, pagination, sorting, and error behavior explicitly.
- Make writes transactional where partial success would corrupt user data.
- Design retry and idempotency behavior for payments, webhooks, and external providers.
- Keep response envelopes stable and truthful; never return fabricated success states.
- Add tests for invalid input, missing resources, unauthorized access, retries, and concurrency.

## Required checks

- `bun --cwd apps/nest-api run lint`
- `bun --cwd apps/nest-api run typecheck`
- `bun --cwd apps/nest-api run test`
- Relevant `test:e2e` or `test:integration` checks for contract changes
- API documentation and changelog review for every endpoint change

## Escalation

Raise a card for auth behavior, shared infrastructure, database migration mechanics, or client
requirements. Coordinate contract changes with every known consumer before implementation.
