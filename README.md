# Personal OS

[![CI](https://github.com/shabirkhan-dev/personal-os/actions/workflows/ci.yml/badge.svg)](https://github.com/shabirkhan-dev/personal-os/actions/workflows/ci.yml)
[![Security](https://github.com/shabirkhan-dev/personal-os/actions/workflows/security.yml/badge.svg)](https://github.com/shabirkhan-dev/personal-os/actions/workflows/security.yml)

Personal life operating system — track routines, finance, skincare, food, fashion, and everything about your day.

Built on a **Bun + Turborepo** monorepo (Next.js web, Expo mobile, NestJS API, Fumadocs docs, optional AI and Rust). Product modules are rolling out on top of this foundation — see the [production roadmap](apps/docs/content/docs/production-roadmap.mdx).

> Workspace packages use the `@personal-os/*` npm scope.

## Quick start

**Prerequisites**

- [Bun](https://bun.sh) `1.3.13`
- Optional: Docker Compose `v2.20+`, Rust toolchain (for `apps/rust`)

```bash
git clone https://github.com/shabirkhan-dev/personal-os.git
cd personal-os
bun install
bun run prepare
bun run dev
```

| App | URL (dev) |
| --- | --- |
| Web | http://localhost:3000 |
| Nest API | http://localhost:4000 |
| Docs | http://localhost:3002/docs |

## What we are building

| Domain | What Personal OS covers |
| --- | --- |
| **Daily life** | Routines, habits, schedules |
| **Finance** | Budgets, spending, goals |
| **Personal care** | Skincare, grooming, wellness |
| **Food** | Meals, diet, planning |
| **Fashion** | Wardrobe, outfits, style |

**Core loop:** capture what you did or plan to do → see your life in one dashboard → AI helps you stay on track.

## Root commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start workspace dev servers |
| `bun run build` | Build all apps |
| `bun run lint` / `lint:fix` | Biome + script linters |
| `bun run typecheck` | TypeScript across workspaces |
| `bun run test` / `test:coverage` | Tests + coverage |
| `bun run architecture:check` | Import boundary rules |
| `bun run preflight` | Lint + typecheck + test |

## Documentation

| Doc | Purpose |
| --- | --- |
| [Production roadmap](apps/docs/content/docs/production-roadmap.mdx) | Vision, domains, and milestones |
| [PROJECT.md](PROJECT.md) | Monorepo layout and conventions |
| [AGENTS.md](AGENTS.md) | Instructions for AI agents |
| [DESIGN.md](DESIGN.md) | UI design brief |
| `apps/docs` | Fumadocs site |

## License

Dual-licensed under **MIT** or **Apache-2.0**: [LICENSE-MIT](LICENSE-MIT), [LICENSE-Apache-2.0](LICENSE-Apache-2.0).
