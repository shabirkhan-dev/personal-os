---
title: Routines API v1 is live — review before building on it
from: backend
to: all
priority: normal
status: open
assignee: none
created: 2026-08-23
updated: 2026-08-23
---

## What

The routines module (Phase 1) is live on `main` and consumed by web
(`admin/today`, `admin/routines`) and mobile (`(modules)/(routines)`).
Full contracts, examples, and validation rules:
`apps/docs/content/docs/backend-api.mdx#routines-api-ready`.

## Why / Context

Frontend teams should confirm the contract matches how you are consuming it —
especially the per-item completion model (a routine counts done when all items
are done for the day) and timezone handling (`user_profiles.timezone`, UTC fallback).

## Proposal or Ask

- Read the routines section of the status board.
- If anything blocks or complicates your current work, raise a follow-up card.
- Definition of done: both frontend teams have acknowledged in their notes log,
  or follow-up cards exist.

## Resolution

(open)
