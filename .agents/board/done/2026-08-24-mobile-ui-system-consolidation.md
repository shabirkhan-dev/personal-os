---
from: human
to: mobile
priority: normal
status: done
assignee: mobile
created: 2026-08-24
updated: 2026-08-24
---

# Consolidate mobile styling and design tokens

## Context

The shipped UI uses a neon `StyleSheet`/`NeonColors` system while shared
components also use Uniwind/Tailwind classes and the unused Expo template
`Colors`/`ThemedText`/`ThemedView` system. `global.css` is imported from both
the root layout and `src/constants/theme.ts`, despite the Expo guidance to
import it only from the root layout. `NeonCard` declares `glowPosition` but
ignores it, while its call sites still pass an undeclared `accentColor` prop.

## Requested outcome

Choose one canonical token and primitive system, then migrate or remove the
other system. Keep platform-specific exceptions explicit and ensure light/dark
behavior is intentional rather than inherited from starter classes.

## Definition of done

- Colors, spacing, typography, radii, elevation, and interaction states come
  from one documented mobile token source.
- `global.css` has one root import and no duplicate theme ownership.
- Shared primitives have accurate prop contracts and tested variants.
- Native and web screenshots show consistent hierarchy, contrast, and spacing.

## Resolution

- Migrated `apps/mobile/src/global.css` to standard shadcn tokens using Tailwind CSS v4 `@theme inline` mapping `--color-background`, `--color-foreground`, `--color-card`, `--color-primary`, `--color-secondary`, `--color-muted`, `--color-accent`, `--color-destructive`, `--color-border`, `--color-input`, `--color-ring`, and `--radius-*`.
- Removed redundant `import "@/global.css"` from `src/constants/theme.ts`.
- Updated `src/constants/design-system.ts` to export canonical `ShadcnTokens` and proxy legacy `NeonColors` to maintain backward compatibility across existing screens.
- Cleaned and aligned primitive contracts across `NeonCard`, `IconProps`, and widgets.
