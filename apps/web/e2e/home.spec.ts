import { expect, test } from "@playwright/test";

test("home page renders the landing hero heading", async ({ page }) => {
	await page.goto("/");
	await expect(
		page.getByRole("heading", { name: /Ship a production-grade monorepo/i }),
	).toBeVisible();
});
