import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const API = "http://localhost:4000/api/v1";

const user = {
	id: "9d3f45e6-f7df-4f64-8bd2-c20a2dd28722",
	email: "personal@example.com",
	username: "personal",
	isActive: true,
	emailVerified: true,
	hasPassword: true,
	createdAt: "2026-07-13T00:00:00.000Z",
};

const ROUTINE_ID = "11111111-1111-4111-8111-111111111111";
const ITEM_ID = "22222222-2222-4222-8222-222222222222";

function ok(data: unknown): { status: number; contentType: string; body: string } {
	return {
		status: 200,
		contentType: "application/json",
		body: JSON.stringify({ success: true, statusCode: 200, data }),
	};
}

async function mockAuthenticatedSession(page: Page): Promise<void> {
	await page.route(`${API}/auth/refresh`, (route) =>
		route.fulfill(
			ok({
				accessToken: "jwt-token",
				accessTokenExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
				user,
			}),
		),
	);
}

test("today page shows the error state with retry when the API fails", async ({ page }) => {
	await mockAuthenticatedSession(page);
	await page.route(`${API}/routines/today`, (route) =>
		route.fulfill({
			status: 500,
			contentType: "application/json",
			body: JSON.stringify({ success: false }),
		}),
	);

	await page.goto("/admin/today");

	await expect(page.getByText(/could not load today/i)).toBeVisible();
	await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
});

test("today page renders routines and toggling an item updates the badge", async ({ page }) => {
	await mockAuthenticatedSession(page);

	const state = { drinkWaterDone: false };
	function todayView() {
		return {
			date: "2026-08-23",
			timeZone: "UTC",
			weekday: 7,
			routines: [
				{
					id: ROUTINE_ID,
					name: "Morning routine",
					description: null,
					completedItems: state.drinkWaterDone ? 1 : 0,
					totalItems: 2,
					items: [
						{ id: ITEM_ID, name: "Drink water", targetTime: null, completed: state.drinkWaterDone },
						{
							id: "33333333-3333-4333-8333-333333333333",
							name: "Stretch",
							targetTime: "07:00",
							completed: false,
						},
					],
				},
			],
		};
	}

	await page.route(`${API}/routines/today`, (route) => route.fulfill(ok(todayView())));
	await page.route(`${API}/routines/${ROUTINE_ID}/items/${ITEM_ID}/toggle`, (route) =>
		route.fulfill(ok({ itemId: ITEM_ID, date: "2026-08-23", completed: true })),
	);

	await page.goto("/admin/today");

	const routineHeading = page.getByRole("heading", { name: "Morning routine" });
	await expect(routineHeading).toBeVisible();
	await expect(page.getByText("0 of 2 done")).toBeVisible();

	state.drinkWaterDone = true;
	await page.getByLabel("Mark Drink water complete").click();

	await expect(page.getByText("1 of 2 done")).toBeVisible();
});

test("routines page shows empty state with a create CTA when no routines exist", async ({
	page,
}) => {
	await mockAuthenticatedSession(page);
	await page.route(`${API}/routines?*`, (route) => route.fulfill(ok([])));
	await page.route(`${API}/routines`, (route) => route.fulfill(ok([])));

	await page.goto("/admin/routines");

	await expect(page.getByText(/no routines yet/i)).toBeVisible();
});
