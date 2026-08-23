---
from: human
to: backend
priority: normal
status: done
assignee: backend
created: 2026-08-24
updated: 2026-08-24
---

# Add structured backend error and request observability

## Context

`HttpExceptionFilter` converts unexpected exceptions to a generic 500 response
but does not log the exception. The request ID is returned to clients, yet
there is no request completion/status/duration log and inbound IDs are accepted
as arbitrary strings.

Relevant code: `apps/nest-api/src/common/filters/http-exception.filter.ts`,
`request-id.middleware.ts`, and `app.setup.ts`.

## Requested outcome

Emit structured, redacted error/request logs keyed by a sanitized request ID,
including route, status, duration, and safe user/session context where
available. Never log access, refresh, OTP, cookie, or provider secrets.

## Definition of done

- Unexpected 5xx errors are diagnosable from logs using the response request ID.
- Health/noise and sensitive fields are redacted consistently.
- Request ID format and log correlation are tested.

## Resolution

`request-id.middleware.ts` now constrains inbound IDs to `[A-Za-z0-9._:-]{1,64}`
(arbitrary strings rejected) and stamps `startedAt`. `ResponseInterceptor` logs
successful requests and `HttpExceptionFilter` logs 5xx/unexpected errors (name,
message, stack) keyed by request ID. New `common/observability/http-logging.ts`
formats `METHOD path status durationMs requestId` and skips `/health` and `/docs`.
No bodies, headers, or credentials are ever logged.
