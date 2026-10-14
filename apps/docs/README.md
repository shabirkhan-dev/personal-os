# docs

Personal OS documentation site (Next.js + Fumadocs).

All project docs live in `content/docs/` and are served from this app.

```bash
bun --cwd=apps/docs run dev
```

Open http://localhost:3002/docs

## Content map

| Path | Topic |
| --- | --- |
| `/docs` | Home |
| `/docs/quick-start` | Bootstrap |
| `/docs/production-roadmap` | Built so far and next |
| `/docs/product-system-design` | Architecture & data model |
| `/docs/architecture` | Boundaries + ADRs |
| `/docs/docker` | Compose / Postgres |
| `/docs/qol` | Hooks, CI, tooling |

Agents should use these pages plus root `AGENTS.md` / `DESIGN.md` / `PROJECT.md`.
