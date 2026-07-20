# Agent instructions (Personal OS)

Universal instructions for AI agents (Cursor, Copilot, Claude Code, Windsurf, Cline, Aider, etc.).
Read this file first when working in this repo.

## Project overview

Monorepo **Personal OS** — a personal life operating system (routines, finance, skincare, food,
fashion) — managed with **Turborepo + Bun**. See `plan.md` for product vision.

## Documentation

There is **no root `docs/` folder**. Project docs live in the docs app:

- Source: `apps/docs/content/docs/`
- Dev: `bun --cwd apps/docs run dev`
- Browse: http://localhost:3002/docs

Key routes: `/docs/quick-start`, `/docs/production-roadmap`, `/docs/architecture`,
`/docs/docker`, `/docs/deploy`, `/docs/qol`, `/docs/ai-first-workflow`, `/docs/overrides`,
`/docs/product-system-design`. Also see root `README.md`, `PROJECT.md`, and `DESIGN.md`.

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->
## Repository layout

```
personal-os/
├── apps/
│   ├── web/             # Next.js (React, Tailwind, shadcn-style UI)
│   ├── mobile/          # Expo Router + NativeWind app (TypeScript)
│   ├── nest-api/        # NestJS production API (PostgreSQL in later phases)
│   ├── docs/            # Docs site (Fumadocs); source in apps/docs/content/docs/
│   ├── ai-api/          # FastAPI AI assist (uv); Nest proxies, never public LLM keys
│   └── rust/            # Rust binary (Cargo, Axum)

├── packages/
│   ├── typescript-config/ # Shared tsconfig bases (base.json, nextjs.json)
│   ├── ui/              # Shared web UI primitives + shadcn styles/tokens
│   └── logger/          # Shared logger (TS + Rust)
├── scripts/             # Utility scripts: bash/, python/
├── docker/              # Docker Compose fragments (see docker/README.md)
├── .cursor/rules/       # Cursor-specific rules (also summarised below)
├── .devcontainer/       # Dev Container (Bun, Rust, Python, Bash tooling)
├── .github/workflows/   # CI (lint, typecheck, build, test)
└── (root config)        # biome.json, turbo.json, lefthook.yml, .editorconfig, etc.
```

## Tooling and commands

| Tool | Purpose | Config |
|------|---------|--------|
| **Bun** | Package manager and script runner (not npm/yarn/pnpm) | `package.json` workspaces |
| **Turborepo** | Monorepo orchestration | `turbo.json` |
| **Biome** | Lint + format for TS/JS | `biome.json` (tabs, line width 100) |
| **Lefthook** | Git hooks (pre-commit, commit-msg) | `lefthook.yml` |
| **EditorConfig** | Consistent indent/charset/line endings | `.editorconfig` |

**Run everything from repo root:**

| Command | What it does |
|---------|-------------|
| `bun install` | Install all dependencies |
| `bun run prepare` | Install git hooks (lefthook) |
| `bun run dev` | Start all dev servers (Turbo) |
| `bun run build` | Build all apps (Turbo) |
| `bun run lint` | Lint: Biome (TS/JS) + ShellCheck + ruff |
| `bun run lint:fix` | Lint with auto-fix |
| `bun run format` | Format: Biome + shfmt + ruff + cargo fmt |
| `bun run typecheck` | TypeScript typecheck |
| `bun run test` | Run tests (e.g. cargo test) |
| `bun run test:coverage` | Run TS coverage + all language tests |
| `bun run test:e2e:web` | Run web Playwright e2e tests |
| `bun run architecture:check` | Enforce architecture import boundaries + kebab-case naming |
| `bun run naming:check` | Enforce kebab-case (dotted Nest-style) file/folder names |

## Conventions

### Code style

- **Formatter**: Biome. Tabs, line width 100. Applies to `apps/**/*.ts(x)`, `packages/**/*.ts(x)`,
  root config files. Run `bun run format` or rely on pre-commit hook.
- **No ESLint/Prettier**: Biome is the only lint/format tool for TS/JS in this project.
- **Naming**: PascalCase for components; files match component name. Hooks use `use*` prefix;
  utility functions are plain named exports.
- **Imports**: Prefer workspace imports as `@personal-os/<package>` (e.g. `@personal-os/ui`).
  Group: external → workspace → relative. No unused imports.
- **Types**: Explicit types for props and public APIs. Avoid `any`; use `unknown` and narrow.
- **Errors**: Handle explicitly — log and rethrow, or use result types. No silent catches.
- **Size**: Small, single-responsibility functions and components. Extract when complexity grows.

### Project structure

- **Monorepo**: Apps in `apps/`, shared code in `packages/`. When a change applies across apps,
  prefer changing a shared package.
- **New apps**: Add under `apps/`, wire into `turbo.json` tasks if needed.
- **New packages**: Add under `packages/`, export via `@personal-os/<name>`.
- **Shared UI**: `packages/ui` uses shadcn-style components. Shared Tailwind tokens live in
  `packages/ui/src/styles/globals.css`.
- **TypeScript config**: Extend from `packages/typescript-config/base.json` (or `nextjs.json`
  for Next.js apps).
- **Expo mobile structure**: Use `src/app` for routes, `src/components/ui` for UI primitives,
  and `src/components` for non-UI reusable components.
- **Safe area in mobile**: Use `react-native-safe-area-context` instead of deprecated
  `react-native` `SafeAreaView`.

### Git and commits

- **Pre-commit hooks** (Lefthook): auto-format, lint, typecheck, large-file guard (2 MB max),
  secret scan, architecture check. Hooks run automatically if installed via `bun run prepare`.
- **Commit messages**: Enforced by `commit-msg` hook — Conventional Commits only
  (`feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert`), **all lowercase**,
  10–200 chars, no WIP. Example: `feat(auth): add nestjs login and shared ui forms`.
- **Do not commit**: build output (`.next/`, `dist/`, `target/`), `node_modules/`, `.env` files,
  cache dirs. These are in `.gitignore`.
- **Separate concerns**: Don't mix lint/format-only fixes with feature changes in the same commit.

### Per-language notes

| Language | Lint | Format | Test |
|----------|------|--------|------|
| **TypeScript/JS** | Biome | Biome | Vitest/Jest (if added) |
| **Rust** | Clippy | rustfmt | `cargo test` |
| **Bash** | ShellCheck | shfmt | — |
| **Python** | ruff check | ruff format | — |

### Docker

Postgres, Nest API, and Next.js via Compose fragments under `docker/compose/`
(merged by root `docker-compose.yml`, Compose v2.20+, no `version:` key):

```bash
cp env.docker.example .env
docker compose up -d --build
```

Defaults: web `:3000`, Nest `:4000`, Postgres host `:5433`. Optional Rust:
`docker compose --profile rust up -d --build`. Host-only API/web: start `postgres`
only, then `bun run dev`. See `/docs/docker` and `docker/README.md`.

## Before finishing any task

1. Run `bun run lint` from repo root — fix any errors.
2. Run `bun run format` from repo root — ensure formatting is clean.
3. If you changed TypeScript, run `bun run typecheck`.
4. Do not leave dead code, unused imports, or `any` types.

## Key files to read for deeper context

- `PROJECT.md` — detailed layout, tooling, and commands.
- `DESIGN.md` — design-system brief for UI generation and review.
- **Docs app** (`apps/docs`, run with `bun --cwd apps/docs run dev`):
  - `/docs/production-roadmap` — production build phases and Nest API spine
  - `/docs/ai-first-workflow` — school-os audit and AI-first workflow roadmap
  - `/docs/qol` — full QoL stack (hooks, CI, per-language tools)
  - `/docs/architecture` — architecture baseline and enforceable boundaries
  - `/docs/overrides` — policy for project-specific architecture overrides
  - `/docs/docker` — Docker Compose setup
  - `/docs/deploy` — Vercel (web/docs) + Render (Nest) + Neon
  - `/docs/product-system-design` — product architecture and security model
- `.cursor/skills/expo-mobile/SKILL.md` — Expo Router + EAS + official Expo Skills / LLM doc links for `apps/mobile`.
- `.agents/skills/browser-ui-test/SKILL.md` — Browser UI/UX verification via Playwright MCP + `apps/web` e2e after interactive web changes.
- `.cursor/rules/expo-ai-agents.mdc` — Expo remote skills URL, skill table, `llms.txt` bundles (when working under `apps/mobile/**`).
- `apps/mobile/AGENTS.md` — Short index for agents opening the mobile app folder.
- `docker/README.md` — Compose fragment layout and `-f` fallback.
- `biome.json` — Biome config (lint rules, formatter settings).
- `lefthook.yml` — Git hook definitions.
- `turbo.json` — Turborepo pipeline config.
