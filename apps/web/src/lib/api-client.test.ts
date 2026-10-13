import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getBaseUrl, login, me, refreshSession, register } from "./api-client";

const user = {
	id: "9d3f45e6-f7df-4f64-8bd2-c20a2dd28722",
	email: "starter@example.com",
	username: "starter",
	isActive: true,
	emailVerified: true,
	hasPassword: true,
	createdAt: "2026-07-13T00:00:00.000Z",
};

describe("api client", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("points at the Nest API by default", () => {
		expect(getBaseUrl()).toContain("localhost:4000");
	});

	it("unwraps the registration challenge", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => successResponse({ accepted: true, message: "Code sent", user }, 201)),
		);

		const result = await register({
			username: "starter",
			email: "starter@example.com",
			password: "a-secure-password",
		});

		expect(result.user.username).toBe("starter");
		expect(result.accepted).toBe(true);
	});

	it("uses credentialed requests for cookie-backed login and refresh", async () => {
		const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
			successResponse({
				accessToken: "jwt-token",
				accessTokenExpiresAt: "2026-07-13T00:15:00.000Z",
				user,
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const loginResult = await login({
			email: "starter@example.com",
			password: "a-secure-password",
		});
		await refreshSession();

		expect("accessToken" in loginResult ? loginResult.accessToken : null).toBe("jwt-token");
		for (const call of fetchMock.mock.calls) {
			expect(call[1]).toEqual(expect.objectContaining({ credentials: "include" }));
			const headers = call[1]?.headers as Headers;
			expect(headers.get("X-Requested-With")).toBe("XMLHttpRequest");
		}
	});

	it("adds the access token to authenticated requests", async () => {
		const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
			successResponse(user),
		);
		vi.stubGlobal("fetch", fetchMock);

		await me("jwt-token");

		const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
		expect(headers.get("Authorization")).toBe("Bearer jwt-token");
	});

	it("surfaces stable API error information", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(
						JSON.stringify({
							success: false,
							statusCode: 401,
							code: "AUTH_INVALID_CREDENTIALS",
							message: "Invalid email or password",
						}),
						{ status: 401 },
					),
			),
		);

		const promise = login({ email: "starter@example.com", password: "wrong-password" });
		await expect(promise).rejects.toMatchObject({
			name: "ApiError",
			statusCode: 401,
			code: "AUTH_INVALID_CREDENTIALS",
		});
		await expect(promise).rejects.toBeInstanceOf(ApiError);
	});
});

function successResponse(data: unknown, status = 200): Response {
	return new Response(JSON.stringify({ success: true, statusCode: status, data }), { status });
}
