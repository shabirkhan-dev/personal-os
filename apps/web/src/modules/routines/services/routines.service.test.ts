import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getApiOrigin } from "@/lib/api/client";
import { routinesService } from "./routines.service";

const token = "jwt-token";

describe("routines service", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("fetches today's view", async () => {
		const fetchMock = mockSuccess({
			date: "2026-08-23",
			timeZone: "UTC",
			weekday: 7,
			routines: [],
		});
		await routinesService.getToday(token);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(`${getApiOrigin()}/api/v1/routines/today`);
		expect(init.method).toBe("GET");
		expect((init.headers as Headers).get("Authorization")).toBe(`Bearer ${token}`);
	});

	it("lists active routines with credentials and CSRF header", async () => {
		const fetchMock = mockSuccess([]);
		await routinesService.list(token);

		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(init.method).toBe("GET");
		expect(init.credentials).toBe("include");
		expect((init.headers as Headers).get("X-Requested-With")).toBeNull();
	});

	it("creates a routine with a JSON body", async () => {
		const fetchMock = mockSuccess({ id: "routine-1" });
		const input = {
			name: "Morning routine",
			description: null,
			scheduleType: "specific_days" as const,
			daysOfWeek: [1, 3, 5],
			items: [{ name: "Drink water", targetTime: "07:00" }],
		};
		await routinesService.create(token, input);

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(`${getApiOrigin()}/api/v1/routines`);
		expect(init.method).toBe("POST");
		expect(JSON.parse(init.body as string)).toEqual(input);
		expect((init.headers as Headers).get("Content-Type")).toBe("application/json");
	});

	it("patches a routine by id", async () => {
		const fetchMock = mockSuccess({ id: "routine-1" });
		await routinesService.update(token, "routine-1", { name: "Renamed", archived: false });

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(`${getApiOrigin()}/api/v1/routines/routine-1`);
		expect(init.method).toBe("PATCH");
		expect(JSON.parse(init.body as string)).toEqual({ name: "Renamed", archived: false });
	});

	it("archives via DELETE", async () => {
		const fetchMock = mockSuccess({ id: "routine-1", archived: true });
		const result = await routinesService.archive(token, "routine-1");

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(`${getApiOrigin()}/api/v1/routines/routine-1`);
		expect(init.method).toBe("DELETE");
		expect(result.archived).toBe(true);
	});

	it("toggles an item for today", async () => {
		const fetchMock = mockSuccess({ itemId: "item-1", date: "2026-08-23", completed: true });
		const result = await routinesService.toggleItem(token, "routine-1", "item-1");

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe(`${getApiOrigin()}/api/v1/routines/routine-1/items/item-1/toggle`);
		expect(init.method).toBe("POST");
		expect(result.completed).toBe(true);
	});

	it("surfaces validation errors from the API envelope", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn(
				async () =>
					new Response(
						JSON.stringify({
							success: false,
							statusCode: 400,
							code: "VALIDATION_ERROR",
							message: "Validation failed",
							errors: [{ path: "name", message: "name is required" }],
						}),
						{ status: 400 },
					),
			),
		);

		const promise = routinesService.create(token, { name: "", scheduleType: "daily" });
		await expect(promise).rejects.toMatchObject({
			name: "ApiError",
			statusCode: 400,
			code: "VALIDATION_ERROR",
		});
		await expect(promise).rejects.toBeInstanceOf(ApiError);
	});
});

function mockSuccess(data: unknown): ReturnType<typeof vi.fn> {
	const fetchMock = vi.fn(
		async () =>
			new Response(JSON.stringify({ success: true, statusCode: 200, data }), { status: 200 }),
	);
	vi.stubGlobal("fetch", fetchMock);
	return fetchMock;
}
