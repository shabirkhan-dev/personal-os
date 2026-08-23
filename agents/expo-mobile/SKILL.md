---
name: expo-mobile
description: Best practices for Expo Router mobile apps in this monorepo personal-os; Tailwind/NativeWind; official Expo Skills and LLM docs.
version: 1.2.0
license: MIT
---

# Expo Mobile Skill (Personal OS)

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
| `expo-tailwind-setup` | Tailwind CSS v4 + react-native-css + NativeWind v5 |
| `expo-ui-jetpack-compose` | `@expo/ui/jetpack-compose` |
| `expo-ui-swift-ui` | `@expo/ui/swift-ui` |
| `native-data-fetching` | fetch, React Query, SWR, errors, caching, offline, Router loaders |
| `upgrading-expo` | SDK upgrades and dependency fixes |
| `use-dom` | Expo DOM — web code in webview / web |

### Example prompts (Expo docs)

- Settings screen + form + navigation → `building-native-ui`
- Tailwind in Expo → `expo-tailwind-setup`
- Recharts via web on native → `use-dom`
- SwiftUI picker → `expo-ui-swift-ui`
- Jetpack Compose MD3 → `expo-ui-jetpack-compose`
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

## Tailwind CSS (and native iOS/Android)

### Use the official Expo skill first

For **end-to-end setup** (versions, Metro, Babel, Expo Router), load the remote skill **`expo-tailwind-setup`**. It targets the current recommended stack:

- **Tailwind CSS v4**
- **react-native-css**
- **NativeWind v5**

Ask Cursor to follow that skill when adding or fixing Tailwind in `apps/mobile` (it complements this file’s monorepo notes).

### How it fits together

| Layer | Role |
|-------|------|
| **Tailwind CSS** | Utility-first styles; configured with `content` paths over `src/**/*` (and any other dirs you use). |
| **NativeWind** | Brings Tailwind-style **`className`** to React Native primitives (`View`, `Text`, etc.) on **iOS and Android**. Plain Tailwind alone does not style native RN views. |
| **Expo web** | Tailwind can style **web** via Metro + `global.css`; see Expo’s guide below. For **native**, still use NativeWind (or Uniwind) unless you use DOM components in a WebView. |

### Expo docs (official)

- **Tailwind in Expo (web + `global.css` + Metro):** https://docs.expo.dev/guides/tailwind/
  - Use **`web.bundler`: `"metro"`** in `app.json` when relying on this guide.
  - Import **`global.css` only from the root `src/app/_layout.tsx`** (not nested layouts), so CSS order stays correct.
  - Keep **`isCSSEnabled: true`** in Metro config if you customize it.
- **NativeWind:** https://www.nativewind.dev/ — follow the version that matches your Expo SDK and the **`expo-tailwind-setup`** skill.

### This monorepo (`apps/mobile`)

- Add packages with **`bun`** from the repo root (`bun install`). Do not use `npm install` inside the workspace (breaks `workspace:*`).
- Typical files you will touch: `package.json`, `tailwind.config.*`, `global.css` (or `src/global.css`), **`src/app/_layout.tsx`** (CSS import), `metro.config.js`, `babel.config.js`, TypeScript env types for `className` (e.g. `nativewind-env.d.ts`), and `tsconfig` `include` for those types.
- Optional: align **design tokens** with the web app by reusing or importing from
  **`packages/ui/src/styles/globals.css`** — wire paths so Metro can resolve them.

### Default template vs Tailwind

A fresh **create-expo-app** template may use **StyleSheet** + **ThemedText** / **ThemedView** only. That is valid. Add Tailwind + NativeWind when you want utility-first styling; migrate screens gradually.

## This monorepo (baseline)

- Expo + Expo Router + TypeScript. Styling: **StyleSheet/themed components by default** in templates, or **Tailwind via NativeWind** once configured (see above).
- Routes: `apps/mobile/src/app/`. Root layout: `src/app/_layout.tsx`.
- Reusable code: `apps/mobile/src/`. UI primitives: `src/components/ui/`.
- **Bun** for install/scripts (see root `AGENTS.md`).

## Commands

- Dev: `bun --cwd apps/mobile run start` (or `run dev` if defined)
- Typecheck: `bun --cwd apps/mobile run typecheck`
- Lint: `bun --cwd apps/mobile run lint`
- Test: `bun --cwd apps/mobile run test`
- EAS dev build Android: `bun --cwd apps/mobile run build:dev:android`
- EAS dev build iOS: `bun --cwd apps/mobile run build:dev:ios`

## Routing

- File-based routes in `src/app/`.
- Home: `src/app/index.tsx`.

## EAS development builds

- Use `expo-dev-client`; config in `apps/mobile/eas.json`.
- Flow: `eas login` → `eas build:configure` → platform build.

## Styling and safe area

- With **NativeWind** enabled: use **`className`** on supported components; keep **`global.css`** imported from the **root** layout only (see Tailwind section).
- Without NativeWind: **StyleSheet** / themed components are fine.
- `react-native-safe-area-context` — not deprecated `SafeAreaView` from `react-native`.

## Expo UI

- Prefer `@expo/ui` where it fits (personal-os may use pieces like `@expo/ui/datetimepicker`).

## References

- https://docs.expo.dev/skills
- https://docs.expo.dev/guides/tailwind/ (Tailwind + Metro + `global.css`)
- https://docs.expo.dev/router/introduction
- https://docs.expo.dev/develop/development-builds/create-a-build
- https://www.nativewind.dev/ (NativeWind — native `className`)
- Repo: **`apps/mobile/AGENTS.md`**, **`.cursor/rules/expo-ai-agents.mdc`**
