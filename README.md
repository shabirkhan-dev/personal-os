# Personal OS

Personal life operating system: routines, finance, skincare, food and fashion in one **mobile** app.
Bun workspaces + Turborepo. The pre-reset tree is archived on the `archive/main-pre-starter` branch.

**Mobile-first.** The Expo app (`apps/mobile`) is the product. It is backed by the NestJS API and
the FastAPI AI service, and styled with the Figma Kit v2 tokens in `packages/tokens`
(`@personal-os/tokens`). The Next.js app in `apps/web` is the public landing page, a static export
served by Cloudflare Workers (see `apps/web/README.md`). To install the app on a phone, see
[apps/mobile/README.md](apps/mobile/README.md).

Dual-licensed **MIT OR Apache-2.0**.

## Quick start

**Prerequisites**

- [Bun](https://bun.sh) `1.4.2` (pinned via `packageManager`)
- Optional: Docker Compose `v2.20+`, Python 3 + uv (`apps/ai-api`, script tests)

```bash
git clone https://github.com/shabirkhan-dev/personal-os.git
cd personal-os
bun install
bun run prepare
bun run dev
```

`bun run dev` starts Metro, the Nest API and the docs site. Start the AI service with
`bun run dev:ai`.

| App | Dev URL |
| --- | --- |
| Expo / Metro | http://localhost:8081 (open in a development build) |
| Nest API | http://localhost:4000 — `/api/v1/health`, `/api/docs` |
| AI API | http://localhost:8000 |
| Docs | http://localhost:3002/docs |

To work on one app in isolation: `bun --cwd=apps/mobile run start` (same pattern for `nest-api`,
`ai-api`, `docs`).

## Layout

| Path | What it is |
| --- | --- |
| `apps/mobile` | Expo SDK 58 app: onboarding v5, then home |
| `apps/nest-api` | NestJS API spine, Drizzle over Postgres/Neon |
| `apps/ai-api` | FastAPI AI assist; Nest proxies it, never public |
| `apps/docs` | Fumadocs site — project docs at `/docs` |
| `apps/web` | Landing page: Next.js static export on Cloudflare Workers |
| `packages/tokens` | `@personal-os/tokens`: Kit v2 colours, spacing, radii, text styles |
| `packages/logger` | `@starter/logger`: shared structured logging |
| `packages/typescript-config` | `@starter/typescript-config`: base tsconfigs |
| `.agents/` | Agent coordination hub, rules and vendored skills |
| `docker/` | Compose fragments: Postgres, Nest API, optional AI API |
| `scripts/` | Bash and Python utilities, plus architecture and naming checks |
| `.github/workflows/` | `ci.yml`, `cd.yml`, `security.yml` |

The design rules live in [DESIGN.md](DESIGN.md).

## Commands

| Command | Does |
| --- | --- |
| `bun run dev` | All dev servers (Turbo) |
| `bun run dev:ai` | FastAPI only |
| `bun run build` | Build every app |
| `bun run lint` / `lint:fix` | oxlint, plus ShellCheck and Ruff over `scripts/` |
| `bun run format` | Format TS/JS and shell |
| `bun run typecheck` | TypeScript across workspaces |
| `bun run test` / `test:coverage` | Unit tests / coverage gates |
| `bun run architecture:check` | Import-boundary rules |
| `bun run naming:check` | File and folder naming rules |
| `bun run preflight` | `lint` + `typecheck` + `test` — run before pushing |

## Tooling

- **Bun** workspaces and **Turborepo** for the task graph
- **oxlint** for linting and **oxfmt** for formatting TS/JS — tabs, line width 100
- **Lefthook** pre-commit and commit-msg, enforcing Conventional Commits
- Bash: ShellCheck + shfmt · Python: Ruff
- **EAS** for development builds and over-the-air updates of the mobile app

## Docker

```bash
cp env.docker.example .env
docker compose up -d --build
```

Nest `:4000`, Postgres on host `:5433`. Add FastAPI with `docker compose --profile ai up -d --build`.
More in [docker/README.md](docker/README.md) and `/docs/docker`.

## Deploy

| Piece | Host | Config |
| --- | --- | --- |
| Mobile | [EAS](https://expo.dev/eas) | `apps/mobile/eas.json` |
| Nest API | [Render](https://render.com) | `render.yaml` |
| Database | [Neon](https://neon.tech) | `DATABASE_URL` |
| Docs | [Vercel](https://vercel.com) | `apps/docs/vercel.json` |

Walkthrough: `/docs/deploy` — [apps/docs/content/docs/deploy.mdx](apps/docs/content/docs/deploy.mdx).

## Dev Container

`.devcontainer/` installs **Bun**, **Python/Ruff** and the Bash lint tools.
See [.devcontainer/README.md](.devcontainer/README.md).

## Docs

```bash
bun --cwd=apps/docs run dev
```

- [/docs/quick-start](http://localhost:3002/docs/quick-start)
- [/docs/architecture](http://localhost:3002/docs/architecture)
- [/docs/deploy](http://localhost:3002/docs/deploy)
- [/docs/docker](http://localhost:3002/docs/docker)
- [/docs/production-roadmap](http://localhost:3002/docs/production-roadmap)

Also in the repo: [PROJECT.md](PROJECT.md), [DESIGN.md](DESIGN.md), [AGENTS.md](AGENTS.md),
[CHANGELOG.md](CHANGELOG.md).

## License

Dual-licensed under **MIT** or **Apache-2.0**, at your option —
[LICENSE-MIT](LICENSE-MIT), [LICENSE-Apache-2.0](LICENSE-Apache-2.0).
