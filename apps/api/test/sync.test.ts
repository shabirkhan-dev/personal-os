import { beforeAll, describe, expect, it } from "vitest";

import { signIn, testApp } from "./support";

const { call } = testApp();

type SyncView = {
	cursor: string;
	changes: { id: string; data: unknown; updatedAt: number; deletedAt: number | null }[];
	conflicts: { id: string; data: unknown; updatedAt: number }[];
	hasMore: boolean;
};

const record = (id: string, updatedAt: number, data: unknown = { id }) => ({
	collection: "career-applications",
	id,
	data,
	updatedAt,
	deletedAt: null as number | null,
});

let token = "";
let otherToken = "";

async function sync(cursor: string | null, changes: unknown[], as = token) {
	const response = await call<{ data: SyncView }>("POST", "/sync", {
		token: as,
		body: { cursor, changes },
	});
	return { status: response.status, json: response.json, data: response.json?.data as SyncView };
}

beforeAll(async () => {
	token = (await signIn(call)).accessToken;
	otherToken = (await signIn(call)).accessToken;
});

describe("POST /sync", () => {
	it("stores pushed records and returns them after the cursor", async () => {
		const first = await sync(null, [record("a1", 1_000)]);
		expect(first.data.conflicts).toHaveLength(0);
		expect(first.data.changes.map((change) => change.id)).toEqual(["a1"]);
		const second = await sync(first.data.cursor, []);
		expect(second.data.changes).toHaveLength(0);
		expect(second.data.cursor).toBe(first.data.cursor);
	});

	it("keeps the newest version and returns the server copy as a conflict", async () => {
		const start = await sync(null, []);
		await sync(start.data.cursor, [record("c1", 5_000, { v: "new" })]);
		const stale = await sync(start.data.cursor, [record("c1", 4_000, { v: "old" })]);
		expect(stale.data.conflicts).toEqual([
			expect.objectContaining({ id: "c1", updatedAt: 5_000, data: { v: "new" } }),
		]);
		const newer = await sync(start.data.cursor, [record("c1", 6_000, { v: "newer" })]);
		expect(newer.data.conflicts).toHaveLength(0);
		expect(newer.data.changes.find((change) => change.id === "c1")?.data).toEqual({ v: "newer" });
	});

	it("syncs deletions as tombstones", async () => {
		await sync(null, [record("d1", 1_000)]);
		const deleted = await sync(null, [{ ...record("d1", 2_000), deletedAt: 2_000 }]);
		expect(deleted.data.changes.find((change) => change.id === "d1")?.deletedAt).toBe(2_000);
	});

	it("pages pulls of 500 and never leaks another user's records", async () => {
		await sync(null, [record("private", 1_000)], otherToken);
		const batches = Array.from({ length: 3 }, (_, batch) =>
			Array.from({ length: 200 }, (__, index) => record(`p${batch}-${index}`, 10_000 + index)),
		);
		for (const batch of batches) {
			// oxlint-disable-next-line eslint/no-await-in-loop -- pushes are ordered
			await sync(null, batch);
		}
		const page = await sync(null, []);
		expect(page.data.changes).toHaveLength(500);
		expect(page.data.hasMore).toBe(true);
		const rest = await sync(page.data.cursor, []);
		expect(rest.data.hasMore).toBe(false);
		const ids = [...page.data.changes, ...rest.data.changes].map((change) => change.id);
		expect(ids).not.toContain("private");
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("rejects clocks far ahead, duplicates and oversized records", async () => {
		const ahead = await sync(null, [record("f1", Date.now() + 3 * 86_400_000)]);
		expect(ahead.json).toMatchObject({ code: "SYNC_CLOCK_AHEAD" });
		const duplicate = await sync(null, [record("x", 1), record("x", 2)]);
		expect(duplicate.json).toMatchObject({ code: "SYNC_DUPLICATE_RECORD" });
		const huge = await sync(null, [record("big", 1, { text: "x".repeat(70_000) })]);
		expect(huge.json).toMatchObject({ code: "VALIDATION_FAILED" });
	});

	it("needs a session", async () => {
		expect((await sync(null, [], "")).status).toBe(401);
	});
});
