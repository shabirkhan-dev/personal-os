import { ApiError, apiClient, setAccessTokenRefresher } from "./client";

const fetchMock = jest.fn();

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

beforeEach(() => {
	fetchMock.mockReset();
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	setAccessTokenRefresher(null);
});

describe("api client 401 recovery", () => {
	it("retries once with the refreshed token when a bearer request gets 401", async () => {
		fetchMock
			.mockImplementationOnce(async () =>
				jsonResponse(401, { success: false, statusCode: 401, message: "expired" }),
			)
			.mockImplementationOnce(async () =>
				jsonResponse(200, { success: true, statusCode: 200, data: { ok: true } }),
			);
		setAccessTokenRefresher(jest.fn().mockResolvedValue("fresh-token"));

		const result = await apiClient.get<{ ok: boolean }>("/routines/today", {
			accessToken: "stale-token",
		});

		expect(result).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(2);
		const retryHeaders = new Headers(fetchMock.mock.calls[1][1].headers);
		expect(retryHeaders.get("Authorization")).toBe("Bearer fresh-token");
	});

	it("does not loop when refresh fails and surfaces the 401", async () => {
		fetchMock.mockImplementation(async () =>
			jsonResponse(401, { success: false, statusCode: 401, message: "expired" }),
		);
		setAccessTokenRefresher(jest.fn().mockResolvedValue(null));

		await expect(
			apiClient.get("/routines/today", { accessToken: "stale-token" }),
		).rejects.toMatchObject({ statusCode: 401 });

		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("fails both concurrent 401 requests cleanly when recovery returns null", async () => {
		fetchMock.mockImplementation(async () =>
			jsonResponse(401, { success: false, statusCode: 401, message: "expired" }),
		);
		const refresher = jest.fn().mockResolvedValue(null);
		setAccessTokenRefresher(refresher);

		const [first, second] = await Promise.allSettled([
			apiClient.get("/routines/today", { accessToken: "stale-token" }),
			apiClient.get("/routines/list", { accessToken: "stale-token" }),
		]);

		expect(first.status).toBe("rejected");
		expect(second.status).toBe("rejected");
		expect((first as PromiseRejectedResult).reason).toMatchObject({ statusCode: 401 });
		expect((second as PromiseRejectedResult).reason).toMatchObject({ statusCode: 401 });
		expect(refresher).toHaveBeenCalledTimes(2);
	});

	it("never retries requests that were sent without a bearer token", async () => {
		fetchMock.mockImplementation(async () =>
			jsonResponse(401, { success: false, statusCode: 401 }),
		);
		const refresher = jest.fn().mockResolvedValue("fresh-token");
		setAccessTokenRefresher(refresher);

		await expect(apiClient.post("/auth/login", {})).rejects.toBeInstanceOf(ApiError);

		expect(refresher).not.toHaveBeenCalled();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("does not retry non-auth failures such as server errors", async () => {
		fetchMock.mockImplementation(async () =>
			jsonResponse(500, { success: false, statusCode: 500, message: "boom" }),
		);
		const refresher = jest.fn().mockResolvedValue("fresh-token");
		setAccessTokenRefresher(refresher);

		await expect(apiClient.get("/routines/today", { accessToken: "token" })).rejects.toMatchObject({
			statusCode: 500,
		});

		expect(refresher).not.toHaveBeenCalled();
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
