---
id: pos-ai-product-design
title: Define AI command center experience
type: feature
from: pm
to: ui-ux
priority: high
status: open
assignee: ui-ux
reviewer: reviewer
parent: 2026-08-24-personal-os-intelligence.md
depends_on: []
branch: none
worktree: none
scope:
  - DESIGN.md
allowed_shared: []
created: 2026-08-24
updated: 2026-08-24
---

## What

Create the implementation-ready design contract for Daily Intelligence and Personal OS Chat across
mobile and web.

## Why / Context

The product must feel like a calm operating system with intelligence embedded in workflows, not a
blank chatbot screen. The design must support future context references, action previews, projects,
and memory without introducing a second visual language.

## Proposal or Ask

Update `DESIGN.md` with Figma-quality specifications for:

- Today/Daily Intelligence cards with source references and priority.
- Chat command center with context chips for screen, entity, date, and project.
- User, assistant, system, error, retry, and offline states.
- Read-only insight actions for the first wave.
- Later action-preview, confirmation, undo, project, and memory patterns.
- Mobile keyboard/safe-area behavior and web responsive/keyboard behavior.
- Accessibility, touch targets, contrast, reduced motion, and empty/loading states.

Do not implement app code or invent backend endpoints. Mark design tokens and shared primitives that
web/mobile will need.

## Definition of done

- `DESIGN.md` contains layout, hierarchy, states, interaction rules, responsive/platform details,
  and accessibility acceptance criteria.
- The design clearly separates read-only suggestions from future confirmed actions.
- Web and mobile owners can implement the first wave without guessing.

## Validation

- Review the rendered existing design language and current mobile/web primitives.
- Provide before/after intent, token/component impact, and review notes on this card.

## Resolution

Open.
