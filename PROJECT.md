# Personal OS - Project overview

This document is the deeper technical reference for the Personal OS monorepo.
For quick setup, start with `README.md`.

## What this repository includes

A **Bun + Turborepo** monorepo for Personal OS, a mobile-first life app:

- The Expo app (`apps/mobile`): onboarding v5 from the Figma Kit v2 file, then the home screen
- The NestJS API (`apps/nest-api`) and the FastAPI AI service (`apps/ai-api`)
- The design tokens (`@personal-os/tokens`) shared by mobile and the web landing shell
- A docs site, polyglot scripts, architecture checks, git hooks and CI/security pipelines

## Repository layout

```text
personal-os/
├── apps/
│   ├── mobile/               # Expo Router app (the product)
│   ├── nest-api/             # NestJS API
│   ├── ai-api/               # FastAPI AI assist (uv); the Nest API proxies it
│   ├── docs/                 # Documentation app (Next.js + Fumadocs)
│   └── web/                  # Next.js landing page, static export on Cloudflare Workers
├── packages/
│   ├── tokens/               # @personal-os/tokens: Figma Kit v2 colours, spacing, radii, type
│   ├── logger/               # @starter/logger: structured logger (TypeScript)
│   └── typescript-config/    # @starter/typescript-config: shared TS config bases
├── scripts/                  # Bash and Python scripts, architecture checks, git hooks
├── docker/                   # Docker Compose fragments (Postgres, Nest API, AI API)
├── .agents/                  # Multi-agent coordination hub, rules and vendored skills
├── .github/workflows/        # CI/CD/security workflows
├── .devcontainer/            # Reproducible development environment
├── lefthook.yml              # Git hooks
├── turbo.json                # Turborepo pipeline
└── AGENTS.md                 # Universal AI agent guidance
```

Documentation is served by `apps/docs` (`bun --cwd=apps/docs run dev` → http://localhost:3002/docs).
There is no root `docs/` directory.

## Apps and stacks

| App | Stack | Notes |
| --- | --- | --- |
| `apps/mobile` | Expo SDK 58, Expo Router, Reanimated 4, react-native-svg, Zustand | The product; StyleSheet + tokens |
| `apps/nest-api` | NestJS 11, Zod, Jest | Production API spine |
| `apps/ai-api` | FastAPI, uv | AI assist; never exposes LLM keys publicly |
| `apps/docs` | Next.js + Fumadocs + MDX | Project docs site |
| `apps/web` | Next.js 16 | Landing page, static export deployed to Cloudflare Workers |

## Shared packages

| Package | Workspace import | Purpose |
| --- | --- | --- |
| `packages/tokens` | `@personal-os/tokens` | Kit v2 design tokens (light and dark) |
| `packages/logger` | `@starter/logger` | Shared structured logger |
| `packages/typescript-config` | `@starter/typescript-config` | Reusable TypeScript config presets |

## Root command surface

Run commands from repo root:

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start `dev` tasks via Turborepo |
| `bun run dev:ai` | Start the FastAPI AI service |
| `bun run build` | Build workspace targets |
| `bun run lint` | Lint workspace + scripts |
| `bun run lint:fix` | Apply lint autofixes |
| `bun run format` | Format TS/JS + shell |
| `bun run typecheck` | TypeScript type checking |
| `bun run test` | Run tests in workspace + scripts |
| `bun run test:coverage` | Run the coverage-oriented pass |
| `bun run architecture:check` | Enforce architecture boundaries + kebab-case naming |
| `bun run preflight` | Lint + typecheck + test |
| `bun run prepare` | Install git hooks (Lefthook) |

Run one app directly with `bun --cwd=<app-path> run <script>`, for example
`bun --cwd=apps/mobile run start`, `bun --cwd=apps/nest-api run dev` or `bun --cwd=apps/docs run dev`.

## Tooling and quality system

- **Bun** is the only package manager; workspaces are `apps/*` and `packages/*`
- **Turborepo** orchestrates shared tasks (`turbo.json`)
- **oxlint** lints and **oxfmt** formats TS/JS (tabs, line width 100)
- **Bash:** `shellcheck`, `shfmt` · **Python:** `ruff`, `pytest`
- **Lefthook** (`lefthook.yml`): format, lint, typecheck, architecture check, large-file guard,
  secret scan, and the conventional-commit message check
- **Architecture checks:** `scripts/architecture/check-boundaries.sh` and `check-naming.sh`; see
  docs app `/docs/architecture`

## Mobile builds (EAS)

`apps/mobile` ships through EAS development builds and EAS Update. See `apps/mobile/README.md` for
the build profiles, channels and update commands.

## CI/CD and security

- **CI:** `.github/workflows/ci.yml` runs lint/typecheck/build/test
- **CD:** `.github/workflows/cd.yml` is a staged deploy template (`main` and version tags)
- **Security:** `.github/workflows/security.yml` + Dependabot + CodeQL

## Docker workflow

Postgres, the Nest API and the AI API are composed through root `docker-compose.yml` with fragment
files under `docker/compose/`.

```bash
cp env.docker.example .env
docker compose up -d --build
```

Defaults: Nest `4000`, Postgres host `5433`. More details: docs app `/docs/docker` and
`docker/README.md`.

## Conventions

- Primary repository guidance: `AGENTS.md`; design brief: `DESIGN.md`
- Editor rules: `.agents/rules/`
- Architecture baseline: docs app `/docs/architecture`; overrides: `/docs/overrides`
