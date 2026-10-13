# apps/web is disabled

Personal OS is mobile-only. This Next.js app is kept for reference but is excluded from the Bun
workspace (`"!apps/web"` in the root `package.json`), Turborepo, CI and Docker Compose.

To re-enable it, remove the `"!apps/web"` workspace entry, restore `docker/compose/web.yml` in
`docker-compose.yml`, and re-add the web e2e job to `.github/workflows/ci.yml`.
