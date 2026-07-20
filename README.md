# Starter

[![CI](https://github.com/shabirkhan-dev/personal-os/actions/workflows/ci.yml/badge.svg)](https://github.com/shabirkhan-dev/personal-os/actions/workflows/ci.yml)
[![Security](https://github.com/shabirkhan-dev/personal-os/actions/workflows/security.yml/badge.svg)](https://github.com/shabirkhan-dev/personal-os/actions/workflows/security.yml)


Production-ready school platform monorepo built with **Bun + Turborepo**.

Apps: Next.js web, Expo mobile, NestJS API, Fumadocs docs, optional Rust demo. Shared UI,
hooks, CI, Docker Compose, and a slim Dev Container.

## Quick start

**Prerequisites**

- [Bun](https://bun.sh) `1.3.13`
- Optional: Docker Compose `v2.20+`, Rust toolchain (for `apps/rust`)

```bash
git clone https://github.com/shabirkhan-dev/school-os.git
cd school-os
bun install
bun run prepare
bun run dev
```

| App | URL (dev) |
| --- | --- |
| Web | http://localhost:3000 |
| Nest API | http://localhost:4000 (`/api/v1/health`, `/api/docs`) |
| Docs | http://localhost:3002/docs |

## Monorepo layout

| Area | Purpose |
| --- | --- |
| `apps/web` | Next.js 16 admin + marketing + auth/billing |
| `apps/mobile` | Expo SDK 57 (auth, billing via hosted checkout) |
| `apps/nest-api` | NestJS API spine (Drizzle + Postgres/Neon) |
| `apps/docs` | Fumadocs documentation site |
| `apps/ai-api` | Optional FastAPI AI assist (Nest proxies; not public) |
| `apps/rust` | Optional Rust/Axum demo |
| `packages/*` | Shared `@school-os/ui`, logger, TypeScript configs |
| `docker/` | Compose fragments (Postgres, Nest, web, optional profiles) |
| `.github/workflows/` | CI, CD, Security |
| `.devcontainer/` | Bun + Rust + Python/Bash tooling |

## Root commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start workspace dev servers (Turbo) |
| `bun run build` | Build all apps |
| `bun run lint` / `lint:fix` | Biome + script linters |
| `bun run format` | Format TS/JS, shell, Python, Rust |
| `bun run typecheck` | TypeScript across workspaces |
| `bun run test` / `test:coverage` | Unit + coverage gates |
| `bun run test:e2e:web` | Playwright e2e for web |
| `bun run architecture:check` | Import boundary rules |
| `bun run preflight` | Lint + typecheck + test |

Target one app: `bun --cwd apps/web run dev` (same pattern for mobile, nest-api, docs, rust).

## Tooling

- **Bun** workspaces + **Turborepo**
- **Biome** for TS/JS (tabs, line width 100)
- **Lefthook** pre-commit / commit-msg (Conventional Commits)
- Bash: ShellCheck + shfmt Â· Python: Ruff Â· Rust: rustfmt + clippy

## Docker

```bash
cp env.docker.example .env
docker compose up -d --build
```

- Web `:3000` Â· Nest `:4000` Â· Postgres host `:5433`
- Optional: `docker compose --profile rust up -d --build` Â· `--profile ai` for FastAPI
- Details: `/docs/docker` and [docker/README.md](docker/README.md)

## Deploy

| Piece | Host |
| --- | --- |
| Web + docs | [Vercel](https://vercel.com) (`apps/*/vercel.json`) |
| Nest API | [Render](https://render.com) (`render.yaml`) |
| Database | [Neon](https://neon.tech) (`DATABASE_URL`) |

Guide: `/docs/deploy` (`apps/docs/content/docs/deploy.mdx`).

## Dev Container

`.devcontainer/` installs **Bun**, **Rust**, **Python/Ruff**, and Bash lint tools. C and Lua are not included.

```text
Reopen in Container â†’ bun run prepare â†’ bun run dev
```

See [.devcontainer/README.md](.devcontainer/README.md).

## Docs

```bash
bun --cwd apps/docs run dev
```

- [/docs/quick-start](http://localhost:3002/docs/quick-start)
- [/docs/deploy](http://localhost:3002/docs/deploy)
- [/docs/docker](http://localhost:3002/docs/docker)
- [/docs/architecture](http://localhost:3002/docs/architecture)
- [/docs/production-roadmap](http://localhost:3002/docs/production-roadmap)

Also: [PROJECT.md](PROJECT.md), [DESIGN.md](DESIGN.md), [AGENTS.md](AGENTS.md), [CHANGELOG.md](CHANGELOG.md).

## License

Dual-licensed under **MIT** or **Apache-2.0**:
[LICENSE-MIT](LICENSE-MIT), [LICENSE-Apache-2.0](LICENSE-Apache-2.0).

