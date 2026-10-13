---
name: Starter Roadmap
overview: "Make the starter a safe default base for every Reptex product (Grid and others)."
todos:
  - id: "ui-rebuild"
    content: "Rebuild @rabtx/ui from scratch on platform features, against the Reptex/Grid Figma system; HugeIcons only; shadcn kept as CLI only. See DESIGN.md."
    status: pending
  - id: "docs-drift-cleanup"
    content: "Unify README/PROJECT/docs with actual runtime ports, scripts, and CI behavior."
    status: in_progress
  - id: "test-depth"
    content: "Deepen tests beyond smoke level (contract and behavior tests) and add enforced coverage gates."
    status: pending
  - id: "ci-cd-gates"
    content: "Branch protection aligned to CI jobs, JUnit/report artifacts, rollback and health-check gate in CD."
    status: in_progress
  - id: "architecture-baseline"
    content: "Architecture baseline docs and boundary checks with an override mechanism."
    status: done
  - id: "dx-generators"
    content: "Scaffolding generators and one-command preflight."
    status: pending
isProject: false
---

# Starter Roadmap

Last reviewed: 2026-10-07. Statuses below reflect what is in the repo on that date.

## Goals

- Make this starter safe as the base for every upcoming product built on it (Grid and others).
- Enforce high-confidence quality gates in CI before merge and release.
- Keep the architecture opinionated but easy to override per project.

## Where things stand

Done and verified in the repo:

- CI (`.github/workflows/ci.yml`) is split into `lint`, `typecheck`, `build`, `test` (with a
  coverage artifact) and a web e2e job (with a Playwright report artifact).
- `bun run ci:lint` runs lint plus `architecture:check`, which enforces import boundaries and
  kebab-case naming (`scripts/architecture/`).
- Dependency review and CodeQL run in `.github/workflows/security.yml`.
- CD (`.github/workflows/cd.yml`) has a quality gate, a staging deploy on `main` and a production
  deploy on `v*` tags.
- Lint and format moved to oxlint and oxfmt; the repo lints with zero warnings.
- Architecture docs and the override policy live in the docs app (`/docs/architecture`,
  `/docs/overrides`).

Still open:

- Test depth. The repo has about a dozen test files and one Playwright spec
  (`apps/web/e2e/home.spec.ts`). Coverage is collected and uploaded; whether a minimum threshold
  fails the build is not verified.
- Branch protection matching CI jobs, JUnit reporting, and a rollback or health-check gate in CD
  are not in the repo.
- Generators and a single preflight entry point beyond `bun run preflight`.

## Phase A: UI library rebuild (current focus)

Source of truth for decisions is `DESIGN.md` (Direction, Dependency policy, Open decisions).

- Rebuild `@rabtx/ui` one component at a time: web (native HTML and CSS first) and React
  Native/Expo, sharing tokens and design language.
- Keep the shadcn CLI only; drop its component code, `@base-ui/react`, `class-variance-authority`
  and other dependencies that no longer have a written reason.
- Standardize on HugeIcons; remove `lucide-react`, `lucide-react-native`.
- When a component is rebuilt, switch its consumers over and delete the `@starter/ui` original in
  the same change. Decide what remains of `@starter/ui` (tokens only, or removed) afterwards.
- Locked in `DESIGN.md`: Figma source, Flat and Floating depth, tiered radius, CSS-only motion (no
  animation library), HugeIcons only. Components are rebuilt one at a time, Button first, and shown
  in the playground at `apps/web` `/ui`. Still open: native motion runtime, glass, light theme, font.

## Phase B: Test depth and gates

- Contract-level and behavior-level tests for `nest-api` (auth, session, error shapes), `web`
  (auth and dashboard flows), `packages/logger` edge cases, `apps/rust` and `scripts/*` negative
  paths.
- Shared test utilities and fixture conventions per app; isolate external services with fakes.
- Minimum coverage thresholds for the TypeScript apps and packages first, then other stacks.

## Phase C: CI/CD confidence

- Required branch protection aligned to the CI jobs.
- JUnit test reports and a coverage summary on pull requests.
- CD rollback steps and a health-check gate before a deploy is marked successful.

## Phase D: DX acceleration

- Generators for a feature module, an API route with validator and test, a UI component with test,
  and package bootstrap.
- Release checklist, onboarding path and a troubleshooting matrix as executable runbooks.

## Order

A first, since every product depends on the component library. B and C can proceed in parallel
by different roles. D after B and C are stable.

## Definition of done for "production-ready starter"

- Every PR gated by lint, typecheck and tests; e2e policy enforced.
- `main` has deterministic build and test results with archived reports.
- Architecture rules are documented and machine-enforced.
- A new product can adopt the UI library, the API spine and the agent workflow without removing
  leftovers from other products.
