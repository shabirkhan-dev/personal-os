---
id: pos-ai-initiative
title: Personal OS Intelligence program
type: feature
from: pm
to: all
priority: high
status: open
assignee: pm
reviewer: human
parent: none
depends_on: []
branch: none
worktree: none
scope:
  - apps/docs/content/docs/production-roadmap.mdx
  - apps/docs/content/docs/team-coordination.mdx
  - .agents/board/**
allowed_shared: []
created: 2026-08-24
updated: 2026-08-24
---

# Personal OS Intelligence: Daily Intelligence + Personal OS Chat

## What

Build Personal OS as an intelligent daily operating layer, not a generic chatbot. The first
vertical slice combines proactive Daily Intelligence with context-aware read-only chat for web and
mobile. Later parent-linked slices add confirmed actions, projects, memory, and automations.

## Why / Context

The product direction is recorded in `apps/docs/content/docs/production-roadmap.mdx` under M5.
The existing `apps/ai-api` is only a provider-backed assist endpoint; Nest remains the public
policy boundary. The product must earn trust with useful, explainable intelligence before it is
allowed to mutate durable data.

## Delivery sequence

1. UI/UX contract and states.
2. Nest public AI gateway and authorized context contract.
3. AI/Python structured insight and chat orchestration.
4. Web and mobile Daily Intelligence + Chat surfaces.
5. Independent QA, reviewer gate, and human acceptance.
6. Later: confirmed actions, project creation, memory, and bounded automations.

## Current child cards

- `2026-08-24-ai-product-design.md`
- `2026-08-24-ai-control-plane-v0.md`
- `2026-08-24-ai-orchestrator-v0.md`
- `2026-08-24-web-ai-command-center.md`
- `2026-08-24-mobile-ai-command-center.md`
- `2026-08-24-ai-mvp-verification.md`
- `2026-08-24-ai-mvp-review-gate.md`

## Definition of done

- Daily Intelligence is grounded in authorized Personal OS records and shows source references.
- Web and mobile provide a context-aware chat surface with truthful loading, empty, error, and
  retry behavior.
- No model provider key reaches a client.
- The first slice is read-only; no agent silently mutates durable data.
- Public contracts, privacy boundaries, evaluations, screenshots/device checks, and review evidence
  are complete.
- Human product owner accepts the vertical slice before action execution work starts.

## Scope

**In scope:** first read-only intelligence and chat vertical slice, cross-team contracts, product
design, client surfaces, verification, and review.

**Out of scope for this wave:** confirmed writes, project persistence, long-term memory, background
automations, external tool access, voice, and general-purpose research search.

## Validation

- Child-card validation and independent QA/reviewer evidence.
- API contract and security review.
- Browser and device/simulator verification.
- Human acceptance against the roadmap definition of done.

## Resolution

Open. PM created the program and child cards; implementation begins only after each owner claims a
card and creates its WTP worktree.
