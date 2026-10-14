# Personal OS API

The NestJS API behind the Personal OS mobile app, backed by PostgreSQL (Neon in production),
Drizzle ORM, Zod validation and explicit SQL migrations.

Module data (expenses, meals, workouts, skincare) lives on the phone today. This API holds the
account, the profile and the onboarding answers, and proxies the AI service. See the docs app
`/docs/product-system-design` for the whole picture and `/docs/backend-api` for the contract the
app consumes.

## Modules

| Module                           | What it does                                                                  | Used by the app today             |
| -------------------------------- | ----------------------------------------------------------------------------- | --------------------------------- |
| `auth`                           | Email-code sign-in, sessions, refresh rotation, password and magic-link flows | Email code, refresh, logout, `me` |
| `users`, `profiles`              | Account record, display name, avatar upload                                   | Yes                               |
| `onboarding`                     | Stores the onboarding answers (`/users/me/onboarding`)                        | Yes                               |
| `mfa`, `passkeys`, `social-auth` | TOTP, WebAuthn passkeys, Google sign-in                                       | Not yet (kept by decision, pos-8) |
| `email`                          | Resend delivery for auth codes and links                                      | Yes                               |
| `ai`                             | Proxies `apps/ai-api` with a service token                                    | Not yet                           |
| `health`                         | Liveness probe                                                                | Deploy health checks              |

Auth security in place: short-lived JWT access tokens, rotating hashed refresh tokens (HttpOnly
cookie for browsers, response body for native clients that send `X-Client-Platform: native`),
login lockout, generic responses that avoid user enumeration, CSRF origin/header checks, CORS
allowlist, Helmet and rate limiting. OpenAPI docs run at `http://localhost:4000/api/docs`.

## Setup

```bash
cp apps/nest-api/.env.example apps/nest-api/.env
bun --cwd=apps/nest-api run db:migrate
bun --cwd=apps/nest-api run dev
```

For Neon, replace `DATABASE_URL` with the Neon PostgreSQL connection string. TLS is enabled
automatically for Neon and URLs containing `sslmode=require`.

## Database commands

```bash
bun --cwd=apps/nest-api run db:generate
bun --cwd=apps/nest-api run db:migrate
bun --cwd=apps/nest-api run db:studio
```

Schema changes must be made in `src/database/schema` and committed with the generated migration.
Do not use schema push in shared or production environments.

## Authentication endpoints

All routes are under `/api/v1/auth`.

| Method   | Route                  | Purpose                                               |
| -------- | ---------------------- | ----------------------------------------------------- |
| `POST`   | `/register`            | Create an unverified account and send an OTP          |
| `POST`   | `/verify-email`        | Verify an email OTP                                   |
| `POST`   | `/resend-verification` | Replace the current verification OTP                  |
| `POST`   | `/login`               | Create a secure session                               |
| `POST`   | `/refresh`             | Rotate the refresh token and issue a new access token |
| `POST`   | `/logout`              | Revoke the current refresh session                    |
| `POST`   | `/logout-all`          | Revoke all sessions                                   |
| `GET`    | `/me`                  | Return the authenticated user                         |
| `POST`   | `/forgot-password`     | Request a reset OTP                                   |
| `POST`   | `/reset-password`      | Reset a password and revoke all sessions              |
| `POST`   | `/change-password`     | Change a password and revoke other sessions           |
| `GET`    | `/sessions`            | List active sessions                                  |
| `DELETE` | `/sessions/:sessionId` | Revoke an active session                              |

Additional authentication methods live under `/api/v1/auth/methods` and authenticated factor
management lives under `/api/v1/auth/security`. User profile reads and writes use
`/api/v1/users/me` and `/api/v1/users/me/profile`.

Refresh tokens never appear in JSON responses. Browser clients must use `credentials: "include"`.
Unsafe browser requests must send `X-Requested-With: XMLHttpRequest`.

## Production requirements

- Set unique `JWT_SECRET` and `AUTH_TOKEN_SECRET` values of at least 32 characters.
- Configure `RESEND_API_KEY` and a verified `AUTH_EMAIL_FROM` sender.
- Set `CORS_ORIGIN` to an explicit comma-separated allowlist.
- Enable `TRUST_PROXY=true` behind a trusted reverse proxy.
- Run migrations during deployment before starting new application instances.
- Set `WEB_APP_URL`, `WEBAUTHN_RP_ID`, and `WEBAUTHN_ORIGIN` to the production web origin.
- When the web app and API are on different sites (Vercel ↔ Render), set
  `COOKIE_SAME_SITE=none` so refresh cookies are sent cross-origin (HTTPS required).
- For Google sign-in, set the same web client ID in backend `GOOGLE_CLIENT_ID` and frontend
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

Hosted deploy walkthrough: `/docs/deploy` (Vercel + Render + Neon).
