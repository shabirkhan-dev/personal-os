import { expect, test } from "@playwright/test";

const API = "http://localhost:4000/api/v1";
const sessionId = "11111111-1111-4111-8111-111111111111";

function ok(data: unknown, status = 200) {
	return {
		status,
		contentType: "application/json",
		body: JSON.stringify({ success: true, statusCode: status, data }),
	};
}

test("admin AI creates a conversation, sends a message and restores history", async ({ page }) => {
	const browserErrors: string[] = [];
	const failedRequests: string[] = [];
	const aiRequests: string[] = [];
	page.on("pageerror", (error) => browserErrors.push(error.message));
	page.on("console", (message) => {
		if (message.type() === "error") browserErrors.push(message.text());
	});
	page.on("requestfailed", (request) =>
		failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText}`),
	);
	const session = {
		id: sessionId,
		title: "Help plan my day",
		contextRoute: null,
		contextEntityType: null,
		contextEntityId: null,
		contextDate: null,
		createdAt: "2026-09-17T12:00:00.000Z",
		updatedAt: "2026-09-17T12:00:00.000Z",
	};
	const reply = {
		id: "22222222-2222-4222-8222-222222222222",
		role: "assistant",
		content: "Start with your morning routine.",
		sources: [],
		suggestions: [],
		provider: "test",
		model: "test",
		latencyMs: 5,
		createdAt: "2026-09-17T12:00:01.000Z",
	};
	let created = false;
	let sent = false;
	await page.route(`${API}/**`, async (route) => {
		const request = route.request();
		const path = new URL(request.url()).pathname;
		if (path.endsWith("/auth/refresh")) {
			await route.fulfill(
				ok({
					accessToken: "test-token",
					accessTokenExpiresAt: new Date(Date.now() + 900_000).toISOString(),
					user: {
						id: "test-user",
						username: "tester",
						email: "tester@example.com",
						isActive: true,
						emailVerified: true,
						hasPassword: true,
						createdAt: "2026-09-17T12:00:00.000Z",
					},
				}),
			);
			return;
		}
		aiRequests.push(`${request.method()} ${path}`);
		if (path.endsWith("/ai/chat/sessions")) {
			if (request.method() === "POST") {
				expect(request.postDataJSON()).toMatchObject({ title: "Help plan my day" });
				created = true;
				await route.fulfill(ok(session, 201));
			} else await route.fulfill(ok({ sessions: created ? [session] : [] }));
			return;
		}
		if (path.endsWith(`/ai/chat/sessions/${sessionId}/messages`)) {
			if (request.method() === "POST") {
				expect(request.postDataJSON()).toEqual({ message: "Help plan my day" });
				sent = true;
				await route.fulfill(ok({ message: reply }));
			} else await route.fulfill(ok({ messages: sent ? [reply] : [] }));
			return;
		}
		await route.fulfill({ status: 404, body: "Unexpected API request" });
	});
	try {
		await page.goto("/admin/ai");
		await expect(
			page.getByRole("heading", { name: "Personal OS Chat", exact: true }),
		).toBeVisible();
		await expect(page.getByText("No conversations yet. Send a message to begin.")).toBeVisible();
		await page.getByRole("textbox", { name: "Message", exact: true }).fill("Help plan my day");
		await page.getByRole("button", { name: "Send message", exact: true }).click();
		await expect(page.getByRole("log")).toContainText(reply.content);
		await expect(page).toHaveURL(new RegExp(`session=${sessionId}`));
		await page.reload();
		await expect(page.getByRole("log")).toContainText(reply.content);
		expect(browserErrors).toEqual([]);
		expect(
			aiRequests.filter(
				(request) => request === `POST /api/v1/ai/chat/sessions/${sessionId}/messages`,
			),
		).toHaveLength(1);
	} finally {
		await test.info().attach("browser-diagnostics", {
			body: JSON.stringify({ browserErrors, failedRequests, aiRequests }, null, 2),
			contentType: "application/json",
		});
	}
});
