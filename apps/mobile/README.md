# Personal OS · mobile

Expo Router app (React Native, Reanimated, Zustand). Personal OS is mobile-only; the Next.js web
app in `apps/web` is disabled.

## Run locally

```bash
bun install                      # from the repo root
bun --cwd=apps/mobile run start  # Metro; open in a development build
```

Expo Go cannot load this app (it uses native modules such as `expo-secure-store`,
`react-native-svg` and Reanimated 4), so install a development build first.

## Install on your phone (EAS)

One-time setup, from `apps/mobile`:

```bash
bunx eas-cli login
bun run eas:setup        # eas init (creates the EAS project, writes extra.eas.projectId)
                         # + eas update:configure (writes updates.url)
```

Commit the `app.json` changes those commands make.

### Development build

| Phone | Command | Notes |
| --- | --- | --- |
| Android | `bun run build:dev:android` | Produces an APK; open the build link on the phone to install. |
| iPhone | `bunx eas-cli device:create`, then `bun run build:dev:ios` | Needs an Apple Developer account; register the phone first (ad hoc). |
| iOS Simulator | `bun run build:dev:ios:simulator` | No Apple account needed. |

Then run `bun run start:dev-client` and scan the QR code with the installed app.

### Build size

`app.config.js` adds per-profile Android settings on top of `app.json`. The `development` and
`preview` APKs contain only `arm64-v8a`, which every current phone uses (Galaxy S2x included), and
compress their native libraries. All release builds use R8 code shrinking and resource shrinking.
`production` keeps every ABI because Google Play splits the AAB per device. A local
`expo run:android` keeps all ABIs so emulators still work.

### EAS Update (over the air)

Builds are bound to a channel (`development`, `preview`, `production`, see `eas.json`) and to the
app version (`runtimeVersion.policy: appVersion`). Publish JavaScript changes without a rebuild:

```bash
bun run update:dev       # → development channel
bun run update:preview   # → preview channel (internal testers, `eas build --profile preview`)
```

Bump `expo.version` in `app.json` whenever native code or config changes, so old binaries don't
receive incompatible updates.

## Structure

| Path | What lives there |
| --- | --- |
| `src/app/(onboarding)/` | Onboarding v5 routes, frames 01–18 from Figma |
| `src/modules/onboarding/` | Onboarding store, insight maths, plan derivation and screen building blocks |
| `src/components/ui/` | Kit v2 components (pill button, checkbox, segmented control, select card, toggle, glow) |
| `src/components/icons/` | Kit v2 `Icon/*` glyphs as `react-native-svg` |
| `src/theme/` | Theme provider (Dark default, Light, follows the system) and font helpers |
| `packages/tokens` | `@personal-os/tokens`: colours, spacing, radii, text styles from Figma |

Screens only use tokens; no raw colour values.

## Checks

```bash
bun --cwd=apps/mobile run typecheck
bun --cwd=apps/mobile run lint
bun --cwd=apps/mobile run test         # bun test: insights, plan, store
bun --cwd=apps/mobile run preview:web  # static web export used for screenshots
```
