# apps/web is disabled

Personal OS is mobile-only. This is a minimal Next.js landing-page shell kept for later. It is
excluded from the Bun workspace (`"!apps/web"` in the root `package.json`), Turborepo, CI and
Docker Compose, and only depends on `@personal-os/tokens`.

To enable it:

1. Remove the `"!apps/web"` workspace entry and run `bun install`.
2. Run `bun --cwd=apps/web run dev` (port 3000).
3. Deploy with `vercel.json` (Vercel builds it from the repo root).
