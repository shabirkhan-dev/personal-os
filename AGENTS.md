# Agent instructions (Personal OS)

Universal instructions for AI agents (Cursor, Copilot, Claude Code, Windsurf, Cline, Aider, etc.).
Read this file first when working in this repo.

## Project overview

Personal OS: a mobile-first life app in a **Turborepo + Bun** monorepo. The Expo app is the
product; the API (Hono on Cloudflare Workers, AI included), design tokens and scripts share one
lint/format/build/test surface.

## Before you write code

Multi-agent coordination lives in [.agents/](.agents/README.md). Load these in order:

1. This file
2. [.agents/README.md](.agents/README.md) — the protocol and directory map
3. [.agents/agent-contract.md](.agents/agent-contract.md) — behaviour, evidence, violation policy
4. Exactly one charter from [.agents/roles/](.agents/roles/README.md) — who you are and what you own
5. [.agents/worktrees.md](.agents/worktrees.md) — branch, port and worktree lifecycle
6. Your board card from [.agents/board/](.agents/board/README.md)

The short version (light mode, the default): claim a card before coding, work on a branch
(`agent/<role>/<card-slug>` or the session's branch), write only inside the card's scope, stage
explicit paths rather than `git add -A`, and record real validation output on the card. `main` is
integration-only. Worktrees and a separate reviewer agent are only needed in parallel mode.
[.agents/ownership.yaml](.agents/ownership.yaml) is the machine-readable role-to-path map.

## UI design context

Before changing UI, read [DESIGN.md](DESIGN.md). The design source is the Figma **Kit v2** file
(`3KjKY0nbjCHqKZb0xRhWIh`). Screens use `@personal-os/tokens` through the theme provider and the
Kit v2 components in `apps/mobile/src/components`; no raw colour values. Do not infer the design
solely from existing code. Keep DESIGN.md as the shared source of truth instead of copying design
rules into agent-specific folders.

## Documentation

There is **no root `docs/` folder**. Project docs live in the docs app:

- Source: `apps/docs/content/docs/`
- Dev: `bun --cwd=apps/docs run dev`
- Browse: http://localhost:3002/docs

Key routes: `/docs/quick-start`, `/docs/production-roadmap`, `/docs/architecture`,
`/docs/docker`, `/docs/deploy`, `/docs/qol`,
`/docs/product-system-design`. Also see root `README.md`, `PROJECT.md`, and `DESIGN.md`.

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work (`apps/docs`, `apps/web`), find and read the relevant doc in
`node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

## Repository layout

```
personal-os/
├── apps/
│   ├── mobile/          # Expo Router app — the product (StyleSheet + tokens, Reanimated, Zustand)
│   ├── api/             # Hono API on Cloudflare Workers: auth, sync, R2 uploads, Career AI
│   ├── docs/            # Docs site (Fumadocs); source in apps/docs/content/docs/
│   └── web/             # Next.js landing page (static export → Cloudflare Workers), see apps/web/README.md
├── packages/
│   ├── tokens/          # @personal-os/tokens: Figma Kit v2 colours, spacing, radii, text styles
│   ├── typescript-config/ # Shared tsconfig bases (base.json, nextjs.json)
│   └── logger/          # Shared logger (TypeScript)
├── scripts/             # Utility scripts: architecture/, git-hooks/
├── docker/              # Postgres init script for the root docker-compose.yml
├── .agents/             # Agent hub: roles, board, rules, vendored skills
├── .devcontainer/       # Dev Container (Bun, Bash tooling)
├── .github/workflows/   # CI (lint, typecheck, build, test)
└── (root config)        # .oxlintrc.json, .oxfmtrc.json, turbo.json, lefthook.yml, etc.
```

## Tooling and commands

| Tool | Purpose | Config |
|------|---------|--------|
| **Bun** | Package manager and script runner (not npm/yarn/pnpm) | `package.json` workspaces |
| **Turborepo** | Monorepo orchestration | `turbo.json` |
| **oxlint** | Lint for TS/JS | `.oxlintrc.json` |
| **oxfmt** | Format for TS/JS | `.oxfmtrc.json` (tabs, line width 100) |
| **Lefthook** | Git hooks (pre-commit, commit-msg) | `lefthook.yml` |
| **EditorConfig** | Consistent indent/charset/line endings | `.editorconfig` |

**Run everything from repo root:**

| Command | What it does |
|---------|-------------|
| `bun install` | Install all dependencies |
| `bun run prepare` | Install git hooks (lefthook) |
| `bun run dev` | Start all dev servers (Turbo) |
| `bun run build` | Build all apps (Turbo) |
| `bun run lint` | Lint: oxlint (TS/JS) + ShellCheck |
| `bun run lint:fix` | Lint with auto-fix |
| `bun run format` | Format: oxfmt + shfmt |
| `bun run typecheck` | TypeScript typecheck |
| `bun run test` | Run tests across the workspace |
| `bun run test:coverage` | Run TS coverage + script tests |
| `bun run architecture:check` | Enforce architecture import boundaries + kebab-case naming |
| `bun run naming:check` | Enforce kebab-case (dotted, e.g. `auth.routes.ts`) file/folder names |

## Conventions

### Code style

- **Formatter**: oxfmt. Tabs, line width 100. Applies to `apps/**/*.ts(x)`, `packages/**/*.ts(x)`,
  root config files. Run `bun run format` or rely on pre-commit hook.
- **No ESLint/Prettier**: oxlint and oxfmt are the only lint/format tools for TS/JS in this project.
- **Naming**: PascalCase for components; files match component name. Hooks use `use*` prefix;
  utility functions are plain named exports.
- **Imports**: Prefer workspace imports (e.g. `@personal-os/tokens`).
  Group: external → workspace → relative. No unused imports.
- **Types**: Explicit types for props and public APIs. Avoid `any`; use `unknown` and narrow.
- **Errors**: Handle explicitly — log and rethrow, or use result types. No silent catches.
- **Size**: Small, single-responsibility functions and components. Extract when complexity grows.

### Project structure

- **Monorepo**: Apps in `apps/`, shared code in `packages/`. When a change applies across apps,
  prefer changing a shared package.
- **New apps**: Add under `apps/`, wire into `turbo.json` tasks if needed.
- **New packages**: Add under `packages/`, export via `@personal-os/<name>`.
- **Design system**: tokens live in `packages/tokens` (`@personal-os/tokens`); Kit v2 components
  and icons live in `apps/mobile/src/components`. Icons are the Kit v2 glyphs drawn with
  `react-native-svg`; do not add icon libraries.
- **TypeScript config**: Extend from `packages/typescript-config/base.json` (or `nextjs.json`
  for Next.js apps).
- **Expo mobile structure**: `src/app` for routes, `src/components/ui` for Kit v2 primitives,
  `src/components/icons` for glyphs, `src/modules/<feature>` for feature logic, `src/theme` for
  the theme provider.
- **Safe area in mobile**: Use `react-native-safe-area-context` instead of deprecated
  `react-native` `SafeAreaView`.

### Git and commits

- **Pre-commit hooks** (Lefthook): auto-format, lint, typecheck, large-file guard (2 MB max),
  secret scan, architecture check. Hooks run automatically if installed via `bun run prepare`.
- **Commit messages**: Enforced by `commit-msg` hook — Conventional Commits only
  (`feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`), **all lowercase**,
  10–200 chars, no WIP. Example: `feat(auth): add email code sign-in`.
- **Do not commit**: build output (`.next/`, `dist/`, `target/`), `node_modules/`, `.env` files,
  cache dirs. These are in `.gitignore`.
- **Separate concerns**: Don't mix lint/format-only fixes with feature changes in the same commit.

### Per-language notes

| Language | Lint | Format | Test |
|----------|------|--------|------|
| **TypeScript/JS** | oxlint | oxfmt | Vitest (api, against Postgres), `bun test` (mobile) |
| **Bash** | ShellCheck | shfmt | — |

### Local API

Docker only runs Postgres; the API runs on Workers locally through Wrangler:

```bash
docker compose up -d                      # Postgres on :5433 (dev + test databases)
cp apps/api/.dev.vars.example apps/api/.dev.vars
bun --cwd=apps/api run db:migrate
bun --cwd=apps/api run dev                # http://localhost:4000/api/v1/health
```

See `/docs/docker` and `apps/api/README.md`.

## Before finishing any task

1. Run `bun run lint` from repo root — fix any errors.
2. Run `bun run format` from repo root — ensure formatting is clean.
3. If you changed TypeScript, run `bun run typecheck`.
4. Do not leave dead code, unused imports, or `any` types.

## Key files to read for deeper context

- `PROJECT.md` — detailed layout, tooling, and commands.
- `DESIGN.md` — Kit v2 design brief for UI generation and review.
- **Docs app** (`apps/docs`, run with `bun --cwd=apps/docs run dev`):
  - `/docs/production-roadmap` — what is built and what comes next
  - `/docs/qol` — full QoL stack (hooks, CI, per-language tools)
  - `/docs/architecture` — architecture baseline and enforceable boundaries
  - `/docs/docker` — Docker Compose setup
  - `/docs/deploy` — Cloudflare Workers (API + landing), Hyperdrive + Neon, R2, Vercel (docs)
  - `/docs/product-system-design` — how the system fits together, data, security, direction
- `.agents/skills/expo-mobile/SKILL.md` — Expo Router + EAS + official Expo Skills / LLM doc links for `apps/mobile`.
- `.agents/rules/expo-ai-agents.mdc` — Expo remote skills URL, skill table, `llms.txt` bundles (when working under `apps/mobile/**`).
- `apps/api/README.md` — API layout, config, local dev and deploy commands.
- `.oxlintrc.json` — oxlint rules. `.oxfmtrc.json` — oxfmt formatting.
- `lefthook.yml` — Git hook definitions.
- `turbo.json` — Turborepo pipeline config.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
