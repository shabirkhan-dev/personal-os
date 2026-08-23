# Agent role charters

Each agent must load the universal contract and exactly one implementation, planning, review, or
integration charter before acting.

## Load order

1. Root `AGENTS.md`
2. `.agents/README.md`
3. `.agents/agent-contract.md`
4. The relevant role charter below
5. `.agents/worktrees.md` for branch, port, and handoff rules
6. The assigned board card and linked source-of-truth docs

## Implementation roles

- [Backend authentication](backend-auth.md) — auth, MFA, passkeys, and social authentication
- [Backend product](backend-product.md) — product domains and billing
- [Backend platform](backend-platform.md) — infrastructure, database, common services, and
  operational foundations
- [Web](web.md) — Next.js web application
- [Mobile](mobile.md) — Expo Router mobile application

## Control-plane roles

- [Slice architect](slice-architect.md) — decomposes product outcomes into owned, testable cards
- [Reviewer](reviewer.md) — independently checks scope, correctness, and evidence
- [Integrator](integrator.md) — coordinates approved merges and release readiness

Role charters define default ownership. A specific card may narrow the scope further. No card may
silently widen a role's ownership.
