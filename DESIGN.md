# Design System Brief

This file is the source of truth for AI agents and humans when creating UI in Personal OS.
Keep it updated before generating new screens with Claude Code, Cursor, Figma MCP or similar tools.

## Product intent

Personal OS is a personal life operating system: routines, finance, skincare, food and fashion in
one mobile app. Screens should feel calm, personal and precise — a quiet dark canvas, clear type,
and colour used to carry meaning (a module, a status, a highlight), not decoration.

## Figma source

- File: **Kit v2** — `3KjKY0nbjCHqKZb0xRhWIh`
- Onboarding v5: frames 01–18 (splash → plan → personal card → OS card)
- Read frames with the Figma MCP (`get_design_context`, `get_screenshot`, `get_variable_defs`)
  instead of guessing values. When code and Figma disagree, Figma wins unless this file records a
  decision otherwise.

## Platform and dependency policy

- Mobile first: Expo Router + React Native. `apps/web` is a disabled landing-page shell.
- Styling is `StyleSheet` with tokens. No Tailwind, NativeWind or Uniwind.
- Motion is Reanimated 4 (`react-native-worklets`). Respect reduced motion.
- Icons are the Kit v2 `Icon/*` glyphs in `apps/mobile/src/components/icons`, drawn with
  `react-native-svg`. Do not add icon libraries.
- Safe areas use `react-native-safe-area-context`.

## Tokens (`@personal-os/tokens`)

`packages/tokens` mirrors the Figma variable collections. Screens read them through the theme
provider (`usePoTheme()` in `apps/mobile/src/theme`), which resolves Dark (default), Light, or the
system preference. **No raw colour values in screens.**

| Export | What it holds |
| --- | --- |
| `colors.light` / `colors.dark` | `bg*` (canvas, app, subtle, surface, hover, selected, inverse), `text*`, `border*`, `accent*`, `status*` |
| `glowOpacity` | Fill opacity of the blurred colour glows per mode (hero, card, member) |
| `space` | 0, 4, 6, 8, 16, 24, 32 |
| `radius` | `xs` 4, `lg` 12, `2xl` 20, `full` (pills and circles) |
| `stroke` | hairline 1, selected 1.5, checkbox ring 1.75 |
| `elevation` | `card`, `floating`, `pocket` shadows (converted by `toShadowStyle`) |
| `textStyles` | `hero40`, `display36`, `title30`, `title18`, `body15`, `row15`, `text14`, `text14Medium`, `meta13`, `tab11`, `mono13`, `eyebrow11` |

Type is SF Pro (system) for sans and JetBrains Mono for mono; `toTextStyle` maps a token to a
React Native style and `PoText` renders it. Do not invent one-off sizes or colours: add a token
that matches Figma first.

## Components

Kit v2 primitives live in `apps/mobile/src/components/ui`:

| Component | Use |
| --- | --- |
| `PoText` | All text, by `textStyles` name and colour token |
| `PillButton` | Primary / secondary actions, full-width CTAs |
| `HeaderButton` | Circular back / close in the header |
| `Checkbox` | Multi-select rows |
| `SegmentedControl` | Small mutually exclusive choices |
| `SelectCard` | Selectable cards (surface + 1.5px accent border when selected) |
| `Toggle` | Binary settings |
| `Glow` | Blurred colour glow behind heroes and cards |

Feature-specific building blocks stay in their module (e.g. `src/modules/onboarding/components`).
Promote a component to `components/ui` only when a second feature needs it and it has no route or
store coupling.

## Visual principles

- Hierarchy through type and spacing first; colour second; glow and shadow last.
- Glows are intentional (heroes, the personal and OS cards), never a default page background.
- One accent per surface. Status colours carry meaning (success, danger, warning, caution, violet).
- Avoid nested cards, decorative blobs and generic gradients.
- Design every state: loading, empty, error, disabled, pressed, selected, saving, success.
- Thumb-friendly targets (44pt minimum) and readable contrast in both modes.

## Layout rules

- Match the Figma frame's padding and gaps; prefer the `space` scale when a value is on it.
- Stable dimensions for repeated controls; text must not overflow buttons, chips or cards.
- Respect safe areas top and bottom; primary actions sit above the home indicator.

## AI UI generation rules

Before implementing UI, an agent should:

1. Read this `DESIGN.md` and the target Figma frame.
2. Read the existing components and tokens and reuse them.
3. Ask for missing product context if the screen purpose is unclear.

After implementing UI, an agent should:

1. Run lint, typecheck and tests for `apps/mobile`.
2. Check the rendered screen in Dark and Light (development build or `preview:web`).
3. Check long text, empty data, error states and reduced motion.
4. List any intentional differences from the Figma frame.
