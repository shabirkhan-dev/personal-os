# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- NestJS auth API (`/api/v1/auth/*`) with JWT login/register/me for the web app.
- Shared UI auth components via shadcn (`alert`, `spinner`, `input-group`) in `@personal-os/ui`.
- Web login/register flows that call Nest only (no multi-backend API switcher).
- Conventional Commits enforcement in `commit-msg` hook (typed prefixes + all-lowercase subjects).
- Docker Compose services for Nest API and Next.js web (multi-stage images, healthchecks, no Compose `version` key).

### Changed

- Documentation lives only in `apps/docs` (Fumadocs). Removed the root `docs/` pointer folder.
- Architecture boundary check scopes deep `@/modules/*/*/*` imports to consumers outside `src/modules/`.
- Root `format` script tolerates missing local `cargo`/`shfmt` tooling.
- Agent and README docs maps point at `apps/docs` routes (`http://localhost:3002/docs`).

### Removed

- Root `docs/` directory (stale pointer after the docs app migration).
- Web API backend switcher (Python / Rust / Hono).

## [0.1.0] - 2026-02-10

### Added

- Initial Starter monorepo layout (Turborepo + Bun).
- Dual license: MIT and Apache-2.0.

[Unreleased]: https://github.com/shabirkhan-dev/personal-os/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/shabirkhan-dev/personal-os/releases/tag/v0.1.0
