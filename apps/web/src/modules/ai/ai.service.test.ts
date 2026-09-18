import { afterEach, expect, it, vi } from "vitest";
import { getApiOrigin } from "@/lib/api/client";
import { aiService } from "./ai.service";

afterEach(() => vi.unstubAllGlobals());

it("normalizes flat and documented nested session responses without changing the request", async () => {
	const base = {
		id: "11111111-1111-4111-8111-111111111111",
		title: "Plan today",
		createdAt: "2026-09-17T12:00:00.000Z",
		updatedAt: "2026-09-17T12:00:00.000Z",
	};
	const context = {
		route: "/admin/today",
		entity: { type: "routine" as const, id: "22222222-2222-4222-8222-222222222222" },
		date: "2026-09-17",
	};
	const expected = { ...base, context };
	const fetchMock = vi.fn();
	vi.stubGlobal("fetch", fetchMock);

	for (const data of [
		{
			...base,
			userId: "private-owner-id",
			contextRoute: context.route,
			contextEntityType: context.entity.type,
			contextEntityId: context.entity.id,
			contextDate: context.date,
		},
		expected,
	]) {
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify({ success: true, statusCode: 201, data }), { status: 201 }),
		);
		const result = await aiService.createSession("test-token", { title: base.title, context });
		expect(result).toEqual(expected);
		const [url, init] = fetchMock.mock.lastCall as [string, RequestInit];
		expect(url).toBe(`${getApiOrigin()}/api/v1/ai/chat/sessions`);
		expect(init.method).toBe("POST");
		expect(init.credentials).toBe("include");
		expect((init.headers as Headers).get("Authorization")).toBe("Bearer test-token");
		expect(JSON.parse(init.body as string)).toEqual({ title: base.title, context });
	}
});
