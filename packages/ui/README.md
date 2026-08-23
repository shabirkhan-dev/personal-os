# `@personal-os/ui`

Shared shadcn/ui primitives for the Personal OS monorepo.

This package follows the [shadcn monorepo](https://ui.shadcn.com/docs/monorepo) layout:

- UI primitives live in `src/components`
- Shared helpers in `src/lib`
- Shared hooks in `src/hooks`
- Design tokens + theme in `src/styles/globals.css`
- CLI config in `components.json`

## Add components

Run the CLI **from the app workspace** (not the package):

```bash
cd apps/web
bunx --bun shadcn@latest add button
```

The CLI installs primitives into `packages/ui` and app-only blocks into `apps/web`.

Keep `style`, `iconLibrary`, and `baseColor` identical in:

- `apps/web/components.json`
- `packages/ui/components.json`

## Importing

Preferred (deep imports — matches CLI aliases):

```tsx
import { Button } from "@personal-os/ui/components/button";
import { cn } from "@personal-os/ui/lib/utils";
import { useIsMobile } from "@personal-os/ui/hooks/use-mobile";
```

Barrel import (still supported):

```tsx
import { Button, Card, cn } from "@personal-os/ui";
```

## Styles

Apps import shared tokens from this package:

```css
@import "tailwindcss";
@import "@personal-os/ui/globals.css";
@source "../../../../packages/ui/src";
```

## Migration rule

Keep product-specific composed UI in `apps/web/src/components`. Move a component here only when it is a reusable primitive with no app routing/auth/data coupling.
