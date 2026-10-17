# Personal OS

Personal OS is a mobile-first life operating system for planning and managing the everyday parts of life: routines, finance, skincare, food, fashion, and daily habits.

It is built as a Bun + Turborepo monorepo with a product-focused Expo app, a Cloudflare Workers API, a documentation app, and a web landing page.

## Why this project exists

Most people track life in disconnected tools: notes, finance apps, shopping lists, routines, and personal health data live in separate places. Personal OS brings those systems together into a single daily operating layer.

The project is designed to help people:

- build sustainable routines and habits
- track personal spending and recurring costs
- monitor skincare and wellness goals
- plan meals and nutrition routines
- manage style and wardrobe decisions
- keep daily life organized in one place

## Product architecture

This monorepo is organized around a few core parts:

- Mobile app: `apps/mobile` — Expo / React Native app, the primary product experience
- API: `apps/api` — Hono app running on Cloudflare Workers with AI-powered capabilities
- Docs: `apps/docs` — Fumadocs site for product and engineering documentation
- Web: `apps/web` — landing page / public shell, built as a static export
- Shared design system: `packages/tokens` — design tokens and visual primitives
- Shared tooling: `scripts/`, `.devcontainer/`, CI and project hooks

## Tech stack

- Bun + Turborepo
- Expo / React Native
- Next.js
- Hono on Cloudflare Workers
- TypeScript
- Postgres / Drizzle
- Cloudflare R2 and Hyperdrive
- Design tokens and mobile-first UI system

## Repository layout

```text
personal-os/
├── apps/
│   ├── mobile/          # Expo app — product surface
│   ├── api/             # Hono API on Cloudflare Workers
│   ├── docs/            # Documentation site
│   └── web/             # Landing page
├── packages/
│   ├── tokens/          # Shared design tokens
│   ├── typescript-config/
│   └── logger/
├── scripts/             # Architecture, checks, hooks
├── docker/              # Postgres setup
├── .agents/             # Agent coordination + policies
├── .devcontainer/       # Dev container setup
├── .github/workflows/   # CI/CD
├── DESIGN.md            # Visual/design source of truth
├── PROJECT.md           # Product/engineering context
├── AGENTS.md            # AI-agent instructions
├── README.md            # This file
├── LICENSE-MIT
├── LICENSE-Apache-2.0
└── package.json
```

## Getting started

### Prerequisites

- [Bun](https://bun.sh) 1.4.2+
- Optional: Docker for local Postgres

### Install and run

```bash
git clone https://github.com/shabirkhan-dev/personal-os.git
cd personal-os
bun install
bun run prepare
bun run dev
```

### Local development URLs

- Expo / Metro: http://localhost:8081
- API: http://localhost:4000/api/v1/health
- Docs: http://localhost:3002/docs
- Landing page: http://localhost:3000

## Local API setup

```bash
docker compose up -d
cp apps/api/.dev.vars.example apps/api/.dev.vars
bun --cwd=apps/api run db:migrate
bun --cwd=apps/api run dev
```

## Common commands

```bash
bun run dev
bun run build
bun run lint
bun run lint:fix
bun run format
bun run typecheck
bun run test
bun run test:coverage
bun run architecture:check
bun run naming:check
```

## Docs and design

The project documentation lives in the docs app and is served locally at:

- http://localhost:3002/docs

Main docs and references:

- `/docs/quick-start`
- `/docs/architecture`
- `/docs/docker`
- `/docs/deploy`
- `/docs/product-system-design`
- `/docs/production-roadmap`

Design rules live in `DESIGN.md` and are the source of truth for the app UI and system tokens.

## License

This project is dual-licensed under:

- MIT
- Apache-2.0

Choose either at your option.
