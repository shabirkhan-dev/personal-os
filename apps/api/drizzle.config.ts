import { defineConfig } from "drizzle-kit";

// `bun run db:generate` writes a migration from the schema; `bun run db:migrate` applies the
// pending ones to DATABASE_URL (Neon in production, the Compose Postgres locally).
export default defineConfig({
	dialect: "postgresql",
	schema: "./src/db/schema/index.ts",
	out: "./src/db/migrations",
	dbCredentials: {
		url:
			process.env.DATABASE_URL ?? "postgresql://personal_os:personal_os@localhost:5433/personal_os",
	},
});
