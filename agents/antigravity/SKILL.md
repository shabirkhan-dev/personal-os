---
name: antigravity
description: Core operating principles and premium design standards for the Antigravity agent in Personal OS.
version: 1.0.0
---

# Antigravity Agent Skill

Use this skill to understand how Antigravity operates within this monorepo to deliver high-quality, reliable, and visually stunning results.

## Core Capabilities

| Capability | Description |
|------------|-------------|
| **Reliability-First** | Aligns with the project roadmap to enforce test depth and CI quality gates. |
| **Premium Design** | Implements state-of-the-art UI with rich aesthetics, gradients, and micro-animations. |
| **Monorepo Mastery** | Expertly navigates Turborepo, Bun, and Biome across TS, Rust, C, and more. |
| **Architecture Aware** | Respects and enforces architectural boundaries and ADRs. |

## Operating Principles

### 1. Verification Before Completion
Never finish a task without ensuring the project is in a valid state:
- Run `bun run lint` and `bun run format` from the root.
- Run `bun run typecheck` for any TypeScript changes.
- Verify tests pass in the affected apps/packages.

### 2. High-Fidelity UI
When working on the frontend (`apps/web`, `apps/mobile`):
- **Rich Palettes**: Avoid default colors; use curated HSL/CSS variables.
- **Motion**: Add subtle hover effects and entry animations.
- **Glassmorphism**: Use backdrop filters and borders where appropriate for a premium feel.

### 3. Tooling Standards
- **Bun**: The only package manager used.
- **Turbo**: Used for task execution and orchestration.
- **Biome**: The sole source of truth for linting and formatting.
- **Workspace Imports**: Always use `@personal-os/*` for internal packages.

## Guidelines for Users
- **Planning**: Antigravity uses the docs app roadmap for complex tasks; keep decisions in `apps/docs/content/docs/`.
- **Progress**: Check `task.md` for real-time progress on active tasks.
- **Feedback**: Antigravity thrives on specific design feedback—mention colors, moods, or specific UI patterns you like.

## References
- [AGENTS.md](../../../AGENTS.md)
- [Production roadmap](../../../apps/docs/content/docs/production-roadmap.mdx)
