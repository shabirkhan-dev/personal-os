# @personal-os/api

The Personal OS API: one Hono app on Cloudflare Workers. It owns email-code sign-in, the profile
and onboarding answers, sync for the app's offline store, avatar uploads to R2, and the module AI
tasks. Postgres is Neon, reached through Hyperdrive. The contract is in the docs app at
`/docs/backend-api`.

## Layout

```text
src/
├── index.ts            # Worker entry: fetch, plus the daily cleanup cron
├── app.ts              # middleware, error handling, route mounting under /api/v1
├── config/
│   ├── env.ts          # vars + secrets → typed Config (zod, checked once per isolate)
│   ├── settings.ts     # fixed product settings (TTLs, limits)
│   └── messages.ts     # every error code: HTTP status + message; success sentences
├── core/               # AppError, ok()/noContent(), validate(), rate limiting, request context
├── db/                 # Drizzle schema, client (per request), migrations
├── lib/crypto.ts       # Web Crypto helpers
└── modules/<name>/     # one feature: <name>.routes.ts, .service.ts, .repository.ts, .schema.ts
    ├── auth            # email code, sessions, refresh rotation
    ├── users           # GET and DELETE /users/me, PATCH /users/me/profile
    ├── assets          # presigned R2 uploads
    ├── onboarding
    ├── sync
    ├── ai              # Module AI: provider, tasks, daily allowance, mock answers, safe page reader
    ├── email           # Resend
    ├── maintenance     # daily cleanup of old codes, sessions and AI usage
    └── health
```

Rules that keep it simple:

- A route validates with `validate("json", schema)`, calls a service, returns `ok(c, data)`.
- A failure is `throw new AppError("CODE")`. The code's status and message live in
  `config/messages.ts`; no route writes its own message or status.
- Every answer has the same envelope: `{ success, statusCode, requestId, timestamp, data }`, or
  `{ success: false, statusCode, code, message, …, errors? }`.
- Code reads `c.get("config")` (typed), never raw env strings.

## Local development

```bash
docker compose up -d                          # from the repo root: Postgres on :5433
cp .dev.vars.example .dev.vars                # local secrets; AI uses the mock provider
bun run db:migrate                            # apply migrations to the dev database
bun run dev                                   # wrangler dev on http://localhost:4000
```

Without `RESEND_API_KEY`, sign-in codes come back in the response as `developmentCode` (never in
production). With `AI_PROVIDER=mock` every AI task answers from the input.

| Command | Does |
| --- | --- |
| `bun run test` | Vitest against `personal_os_api_test` (reset every run) |
| `bun run typecheck` / `lint` | tsc / oxlint |
| `bun run build` | Bundles the Worker (`wrangler deploy --dry-run`) |
| `bun run db:generate` | Writes a migration after a schema change |
| `bun run db:migrate` | Applies pending migrations to `DATABASE_URL` |
| `bun run deploy` | Deploys the Worker |

## Deploy

See `/docs/deploy`: create the Hyperdrive config and R2 bucket, set the secrets with
`wrangler secret put`, run the migrations against Neon, then deploy (Workers Builds or
`bun run deploy`).
