# apps/web: landing page

The public landing page for Personal OS, built from the Figma page "Landing". It is a Next.js
static export: `next build` writes plain HTML, CSS and JS to `out/`, which a Cloudflare Worker serves
as static assets (`wrangler.jsonc`). Only `/api/*` runs Worker code: the launch-day email sign-up
(`worker/notify.ts`) stores addresses in Workers KV.

```bash
bun --cwd=apps/web run dev     # http://localhost:3000 (the sign-up form needs the Worker)
bun --cwd=apps/web run build   # static site in apps/web/out
```

## Layout

- `src/app`: route, layout, theme CSS from `@personal-os/tokens`, favicon and Apple touch icon.
- `src/modules/landing`: the page sections, their copy (`content.ts`) and styles.
- `src/components`: logo, phone frame and the Kit v2 icons the page uses.
- `public/screens`: app screens exported from Figma at 2x (780×1688, WebP).
- `public/_headers`: security headers and caching for the static assets.
- `worker/`: the Worker; `POST /api/notify` with `{ "email": "..." }`.
- `wrangler.jsonc`: Worker name, assets directory and the KV binding.

## Deploy on Cloudflare (Workers Builds)

1. **Workers & Pages → Create → Workers → Import a repository**, pick this repo, branch `main`.
2. Settings:
   - Root directory: `apps/web`
   - Build command: `bun run build`
   - Deploy command: `npx wrangler deploy` (reads `wrangler.jsonc`)
   - Worker name: `personal-os` (must match `name` in `wrangler.jsonc`)
3. Sign-ups: create a KV namespace (**Storage & Databases → KV → Create**, or
   `bunx wrangler kv namespace create personal-os-waitlist`), uncomment `kv_namespaces` in
   `wrangler.jsonc`, paste the id and push. Until then `/api/notify` answers 503 and the form asks
   people to try again.
4. Custom domain: Worker **Settings → Domains & Routes → Add → Custom domain**, for example
   `personalos.your-domain.com` (a zone already on Cloudflare).

Try the Worker locally after a build: `bunx wrangler dev` (uses a local KV store).
Read sign-ups with `bunx wrangler kv key list --namespace-id <id>` (keys are `email:<address>`).
