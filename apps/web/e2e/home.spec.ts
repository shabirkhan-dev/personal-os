import { expect, test } from "@playwright/test";

test("home page renders the landing hero heading", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: /Run your life from one place/i })).toBeVisible();
});
