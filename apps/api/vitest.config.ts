import { defineConfig } from "vitest/config";

// Tests run the Hono app in Node against a real Postgres (TEST_DATABASE_URL, default: the
// Compose database on :5433, `personal_os_api_test`). Files share it, so they run one at a time.
export default defineConfig({
	resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
	test: {
		include: ["test/**/*.test.ts"],
		globalSetup: ["test/global-setup.ts"],
		fileParallelism: false,
	},
});
