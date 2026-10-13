# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Personal OS reset onto the Starter monorepo; the previous tree is on `archive/main-pre-starter`.
- `@personal-os/tokens`: the Figma Kit v2 colours, spacing, radii and text styles (light and dark).
- Kit v2 components and `Icon/*` glyphs (`react-native-svg`) in `apps/mobile`.
- Onboarding v5 (frames 01–18) with a persisted Zustand store, insight chips and Reanimated motion.
- EAS development builds, channels and EAS Update for the mobile app.
- Home placeholder behind the onboarding gate.
- Landing page (`apps/web`): Next.js static export served by Cloudflare Workers, built from the
  Figma "Landing" page, with a Worker for launch-day email sign-ups in Workers KV.

### Changed

- Personal OS is mobile-first: `apps/web` is only the landing page (re-enabled in the workspace).
- Mobile styling is `StyleSheet` + tokens; Uniwind/Tailwind removed from the app.

### Removed

- The Rust demo app (`apps/rust`) and its tooling, Compose profile and agent skills.
- `@starter/ui` (`packages/ui`) and `@rabtx/ui` (`packages/rabtx`).
- The Starter mobile screens (auth, billing, users, component playground).
- The web app's admin, auth, billing and e2e suites.
- Starter leftovers: shadcn and browser-test agent skills, old plans and done cards, `glass.html`.

## [0.1.0] - 2026-02-10

### Added

- Initial Starter monorepo layout (Turborepo + Bun).
- Dual license: MIT and Apache-2.0.

[Unreleased]: https://github.com/shabirkhan-dev/personal-os/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/shabirkhan-dev/personal-os/releases/tag/v0.1.0
