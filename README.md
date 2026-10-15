# Personal OS

Personal life operating system: daily life, training, finance, skincare, food and fashion in one
**mobile** app. Bun workspaces + Turborepo.

**Mobile-first.** The Expo app (`apps/mobile`) is the product. It is backed by one API on Cloudflare
Workers (`apps/api`, Hono, AI included), and styled with the Figma Kit v2 tokens in `packages/tokens`
(`@personal-os/tokens`). The Next.js app in `apps/web` is the public landing page, a static export
served by Cloudflare Workers (see `apps/web/README.md`). To install the app on a phone, see
[apps/mobile/README.md](apps/mobile/README.md).

Dual-licensed **MIT OR Apache-2.0**.

## Quick start

**Prerequisites**

- [Bun](https://bun.sh) `1.4.2` (pinned via `packageManager`)
- Optional: Docker (local Postgres for the API)

```bash
git clone https://github.com/shabirkhan-dev/personal-os.git
cd personal-os
bun install
bun run prepare
bun run dev
```

`bun run dev` starts every app's dev server (Turbo). The API needs Postgres first; see
[Local API](#local-api).

| App | Dev URL |
| --- | --- |
| Expo / Metro | http://localhost:8081 (open in a development build) |
| API (`wrangler dev`) | http://localhost:4000/api/v1/health |
| Docs | http://localhost:3002/docs |
| Landing page | http://localhost:3000 |

To work on one app in isolation: `bun --cwd=apps/mobile run start` (same pattern for `api`,
`docs`).

## Layout

| Path | What it is |
| --- | --- |
| `apps/mobile` | Expo SDK 58 app: onboarding v5, then home |
| `apps/api` | Hono API on Cloudflare Workers: Drizzle over Neon (Hyperdrive), R2, Career AI |
| `apps/docs` | Fumadocs site — project docs at `/docs` |
| `apps/web` | Landing page: Next.js static export on Cloudflare Workers |
| `packages/tokens` | `@personal-os/tokens`: Kit v2 colours, spacing, radii, text styles |
| `packages/typescript-config` | `@personal-os/typescript-config`: base tsconfigs |
| `.agents/` | Agent coordination hub, rules and vendored skills |
| `docker/` | Postgres init script for `docker-compose.yml` |
| `scripts/` | Git hooks plus architecture and naming checks (Bash) |
| `.github/workflows/` | `ci.yml`, `cd.yml`, `security.yml` |

The design rules live in [DESIGN.md](DESIGN.md).

## Commands

| Command | Does |
| --- | --- |
| `bun run dev` | All dev servers (Turbo) |
| `bun run build` | Build every app |
| `bun run lint` / `lint:fix` | oxlint, plus ShellCheck over `scripts/` |
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
- Bash: ShellCheck + shfmt
- **EAS** for development builds and over-the-air updates of the mobile app

## Local API

```bash
docker compose up -d                      # Postgres on host :5433
cp apps/api/.dev.vars.example apps/api/.dev.vars
bun --cwd=apps/api run db:migrate
bun --cwd=apps/api run dev                # http://localhost:4000/api/v1/health
```

More in [apps/api/README.md](apps/api/README.md) and `/docs/docker`.

## Deploy

| Piece | Host | Config |
| --- | --- | --- |
| Mobile | [EAS](https://expo.dev/eas) | `apps/mobile/eas.json` |
| API | [Cloudflare Workers](https://workers.cloudflare.com) | `apps/api/wrangler.jsonc` |
| Database | [Neon](https://neon.tech) through Hyperdrive | `hyperdrive` in `wrangler.jsonc` |
| Images | [Cloudflare R2](https://developers.cloudflare.com/r2/) | `r2_buckets` in `wrangler.jsonc` |
| Docs | [Vercel](https://vercel.com) | `apps/docs/vercel.json` |
| Landing page | [Cloudflare Workers](https://workers.cloudflare.com) | `apps/web/wrangler.jsonc` |

Walkthrough: `/docs/deploy` — [apps/docs/content/docs/deploy.mdx](apps/docs/content/docs/deploy.mdx).

## Dev Container

`.devcontainer/` installs **Bun** and the Bash lint tools.
See [.devcontainer/README.md](.devcontainer/README.md).

## Docs

```bash
bun --cwd=apps/docs run dev
```

- [/docs/quick-start](http://localhost:3002/docs/quick-start)
- [/docs/architecture](http://localhost:3002/docs/architecture)
- [/docs/deploy](http://localhost:3002/docs/deploy)
- [/docs/docker](http://localhost:3002/docs/docker)
- [/docs/product-system-design](http://localhost:3002/docs/product-system-design)
- [/docs/production-roadmap](http://localhost:3002/docs/production-roadmap)

Also in the repo: [PROJECT.md](PROJECT.md), [DESIGN.md](DESIGN.md), [AGENTS.md](AGENTS.md),
[CHANGELOG.md](CHANGELOG.md).

## License

Dual-licensed under **MIT** or **Apache-2.0**, at your option —
[LICENSE-MIT](LICENSE-MIT), [LICENSE-Apache-2.0](LICENSE-Apache-2.0).
