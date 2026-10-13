import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	use: {
		baseURL: "http://127.0.0.1:3005",
		trace: "on-first-retry",
	},
	webServer: {
		command: "bunx next dev -p 3005",
		url: "http://127.0.0.1:3005",
		reuseExistingServer: true,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
