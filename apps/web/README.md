# apps/web: landing page

The public landing page for Personal OS, built from the Figma page "Landing". It is a Next.js
static export: `next build` writes plain HTML, CSS and JS to `out/`, which Cloudflare Pages serves.
The launch-day email sign-up is a Cloudflare Pages Function (`functions/api/notify.ts`) that stores
addresses in Workers KV.

```bash
bun --cwd=apps/web run dev     # http://localhost:3000 (the sign-up form needs Pages, see below)
bun --cwd=apps/web run build   # static site in apps/web/out
```

## Layout

- `src/app`: route, layout, theme CSS from `@personal-os/tokens`, favicon and Apple touch icon.
- `src/modules/landing`: the page sections, their copy (`content.ts`) and styles.
- `src/components`: logo, phone frame and the Kit v2 icons the page uses.
- `public/screens`: app screens exported from Figma at 2x (780×1688, WebP).
- `public/_headers`: security headers and caching for Cloudflare Pages.
- `functions/api/notify.ts`: `POST /api/notify` with `{ "email": "..." }`.

## Deploy on Cloudflare Pages

1. **Workers & Pages → Create → Pages → Connect to Git**, pick this repo and the `main` branch.
2. Build settings:
   - Framework preset: **None**
   - Root directory: `apps/web`
   - Build command: `bun install --frozen-lockfile && bun run build`
   - Build output directory: `out`
3. Environment variables (Production and Preview): `NODE_VERSION` = `22`, `BUN_VERSION` = `1.4.2`.
4. Save and deploy. Pages also picks up `functions/` from the root directory.
5. Sign-ups: **Workers & Pages → KV → Create namespace** (for example `personal-os-waitlist`), then
   in the Pages project **Settings → Bindings → Add → KV namespace**, variable name `WAITLIST`.
   Redeploy so the function sees it. Without the binding the form shows a "try again" message and
   the function logs that the binding is missing.
6. Custom domain: **Custom domains → Set up a domain**, for example `personalos.rabtx.dev` (the
   `rabtx.dev` zone is already on Cloudflare, so the DNS record is added for you).

Read sign-ups with `bunx wrangler kv key list --namespace-id <id>` (keys are `email:<address>`).
