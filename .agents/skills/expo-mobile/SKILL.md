---
name: expo-mobile
description: Best practices for Expo Router mobile apps in this monorepo; StyleSheet + design tokens; official Expo Skills and LLM docs.
version: 1.2.0
license: MIT
---

# Expo Mobile Skill

Use this when working on **`apps/mobile`**.

## Official Expo Skills (Expo + Cursor)

Expo publishes **structured skills** for AI agents (Cursor, Claude Code, Codex, etc.):

1. In **Cursor**: **Settings → Rules & Commands → Project Rules → Add rule → Remote rule**
2. URL: **`https://github.com/expo/skills.git`**

Skills are used via **auto-discovery** when you ask Expo-related questions (not the `/` menu).

### Available skills (from the Expo plugin)

| Skill | Description |
|-------|-------------|
| `building-native-ui` | Expo Router: fundamentals, styling, components, navigation, animations, native tabs |
| `expo-api-routes` | API routes in Expo Router with EAS Hosting |
| `expo-cicd-workflows` | EAS workflow YAML, `.eas/workflows/`, build pipelines |
| `expo-deployment` | iOS, Android, web hosting, API routes |
| `expo-dev-client` | Dev clients locally and TestFlight |
| `expo-module` | Expo Modules API (Swift, Kotlin, TS), config plugins, native views |
| `native-data-fetching` | fetch, React Query, SWR, errors, caching, offline, Router loaders |
| `upgrading-expo` | SDK upgrades and dependency fixes |
| `use-dom` | Expo DOM — web code in webview / web |

### Example prompts (Expo docs)

- Settings screen + form + navigation → `building-native-ui`
- Recharts via web on native → `use-dom`
- App Store deploy → `expo-deployment`
- CI on every PR → `expo-cicd-workflows`
- Upgrade SDK → `upgrading-expo`

## Documentation for LLMs (token-efficient)

Prefer these over scraping full HTML:

| Resource | URL pattern |
|----------|-------------|
| Site index | `https://docs.expo.dev/llms.txt` |
| Full docs bundle | `https://docs.expo.dev/llms-full.txt` |
| EAS bundle | `https://docs.expo.dev/llms-eas.txt` |
| Latest SDK bundle | `https://docs.expo.dev/llms-sdk.txt` |
| Specific SDK line | e.g. `https://docs.expo.dev/llms-sdk-v54.0.0.txt` |

**Per-page markdown:** append **`/index.md`** to any docs page, e.g.
`https://docs.expo.dev/develop/development-builds/create-a-build/index.md`

Match **versioned** SDK bundles to the `expo` version in `apps/mobile/package.json` when you need an exact SDK line.

## Styling: StyleSheet + `@personal-os/tokens`

`apps/mobile` does not use Tailwind, NativeWind or Uniwind. Screens style with `StyleSheet` and
values from `@personal-os/tokens` (colours, spacing, radii, text styles from the Figma Kit v2
file), read through the theme provider (`usePoTheme` in `src/theme/`). No raw colour values in
screens. The remote `expo-tailwind-setup` skill does not apply here.

- Add packages with **`bun`** from the repo root (`bun install`). Do not use `npm install` inside
  the workspace (breaks `workspace:*`).
- Motion uses Reanimated 4 (`react-native-worklets`); icons are the Kit v2 glyphs in
  `src/components/icons/` drawn with `react-native-svg`.

## This monorepo (baseline)

- Expo + Expo Router + TypeScript. Styling: **StyleSheet** with `@personal-os/tokens`.
- Routes: `apps/mobile/src/app/`. Root layout: `src/app/_layout.tsx`.
- Reusable code: `apps/mobile/src/`. UI primitives: `src/components/ui/`.
- **Bun** for install/scripts (see root `AGENTS.md`).

## Commands

- Dev: `bun --cwd=apps/mobile run start` (or `run dev` if defined)
- Typecheck: `bun --cwd=apps/mobile run typecheck`
- Lint: `bun --cwd=apps/mobile run lint`
- Test: `bun --cwd=apps/mobile run test`
- EAS dev build Android: `bun --cwd=apps/mobile run build:dev:android`
- EAS dev build iOS: `bun --cwd=apps/mobile run build:dev:ios`

## Routing

- File-based routes in `src/app/`.
- Groups: `src/app/(onboarding)/` (onboarding v5) and `src/app/(home)/` (gated on onboarding).

## EAS development builds

- Use `expo-dev-client`; config in `apps/mobile/eas.json`.
- Flow: `eas login` → `eas build:configure` → platform build.

## Styling and safe area

- **StyleSheet** with theme tokens from `usePoTheme()`.
- `react-native-safe-area-context` — not deprecated `SafeAreaView` from `react-native`.

## References

- https://docs.expo.dev/skills
- https://docs.expo.dev/router/introduction
- https://docs.expo.dev/develop/development-builds/create-a-build
- Repo: **`.agents/rules/expo-ai-agents.mdc`**
