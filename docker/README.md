# Docker layout

Compose is split into **fragments** under `compose/` and merged by the root
`docker-compose.yml` via [`include`](https://docs.docker.com/compose/how-tos/multiple-compose-files/include/)
(Compose **v2.20+**). Files use the Compose Specification — **no** obsolete top-level `version:` key.

| File | Role |
|------|------|
| `compose/postgres.yml` | Postgres 16, volume, healthcheck |
| `compose/nest-api.yml` | NestJS API image (Bun multi-stage build) |

**Env:** copy `env.docker.example` from the repo root to `.env`.

```bash
cp env.docker.example .env
docker compose up -d --build
```

| Service | Host port (default) |
|---------|---------------------|
| Postgres | 5433 → 5432 |
| Nest API | 4000 |

**Postgres only** (API on the host):

```bash
docker compose up -d postgres
```

**Manual fragment (no `include`):**

```bash
docker compose -f docker/compose/postgres.yml --project-name starter up -d
```
