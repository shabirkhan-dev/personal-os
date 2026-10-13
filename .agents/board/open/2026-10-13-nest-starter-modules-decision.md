---
id: pos-8
title: Decide which Starter API modules Personal OS keeps
type: decision
from: pm
to: human
priority: low
status: open
assignee: none
reviewer: human
parent: none
depends_on: []
branch: none
worktree: none
scope: ["apps/nest-api/src/modules/**"]
allowed_shared: []
created: 2026-10-13
updated: 2026-10-13
---

## What

Billing (Stripe/Razorpay), MFA, passkeys, email and social auth came from the Starter. Decide which stay for Personal OS.

## Why / Context

The owner chose to keep the API as is during the cleanup; this card records the later decision so unused modules do not linger.

## Proposal or Ask

Owner decides per module: keep, park (disable route) or remove. Each removal becomes its own backend card.

## Scope

**In scope:** `apps/nest-api/src/modules/**`

**Out of scope:** anything not listed above; raise a card instead.

## Validation

- decision recorded in Resolution

## Resolution

_Open._
