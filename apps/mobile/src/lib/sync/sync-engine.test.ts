/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { RecordStore, type SyncRecord } from "@/lib/db/record-store";
import { memoryDriver } from "@/lib/db/testing/bun-driver";
import {
	claimStore,
	createSyncEngine,
	PUSH_BATCH,
	type SyncTransport,
	withinBudget,
} from "./sync-engine";

/** The server's rules in memory: newest `updatedAt` wins, every accepted write gets a new seq. */
function fakeServer(pageSize = 500) {
	let seq = 0;
	const rows = new Map<string, SyncRecord & { seq: number }>();
	const transport: SyncTransport = async ({ cursor, changes }) => {
		const conflicts: SyncRecord[] = [];
		for (const change of changes) {
			const key = `${change.collection}/${change.id}`;
			const existing = rows.get(key);
			if (existing && existing.updatedAt >= change.updatedAt) {
				const { seq: _seq, ...record } = existing;
				conflicts.push(record);
				continue;
			}
			seq += 1;
			rows.set(key, { ...change, seq });
		}
		const after = cursor === null ? 0 : Number(cursor);
		const newer = [...rows.values()].filter((row) => row.seq > after).sort((a, b) => a.seq - b.seq);
		const page = newer.slice(0, pageSize);
		const last = page.at(-1)?.seq ?? after;
		return {
			cursor: String(last),
			changes: page.map(({ seq: _seq, ...record }) => record),
			conflicts,
			hasMore: newer.length > page.length,
		};
	};
	return { transport, rows };
}

function device(transport: SyncTransport, start = 1_000) {
	let now = start;
	const clock = () => now;
	return {
		tick: (to: number) => (now = to),
		open: async () => {
			const store = await RecordStore.open(memoryDriver(), clock);
			return { store, engine: createSyncEngine({ store, transport, clock }) };
		},
	};
}

describe("sync engine", () => {
	test("two devices converge through the server", async () => {
		const server = fakeServer();
		const phone = await device(server.transport).open();
		const tablet = await device(server.transport, 2_000).open();

		await phone.store.put("apps", "1", { company: "Acme" });
		await phone.engine.sync();
		await tablet.engine.sync();
		expect(await tablet.store.get("apps", "1")).toEqual({ company: "Acme" });

		await tablet.store.put("apps", "1", { company: "Acme Ltd" });
		await tablet.engine.sync();
		await phone.engine.sync();
		expect(await phone.store.get("apps", "1")).toEqual({ company: "Acme Ltd" });
		expect(await phone.store.pending(10)).toHaveLength(0);
	});

	test("deletes propagate", async () => {
		const server = fakeServer();
		const phone = await device(server.transport).open();
		const tablet = await device(server.transport).open();
		await phone.store.put("apps", "1", { company: "Acme" });
		await phone.engine.sync();
		await tablet.engine.sync();

		await phone.store.remove("apps", "1");
		await phone.engine.sync();
		await tablet.engine.sync();
		expect(await tablet.store.list("apps")).toHaveLength(0);
	});

	test("an older push loses to the server copy and takes it", async () => {
		const server = fakeServer();
		const fast = device(server.transport, 50_000);
		const slow = device(server.transport, 1_000);
		const a = await fast.open();
		const b = await slow.open();

		await b.store.put("apps", "1", { v: "slow clock" });
		await a.store.put("apps", "1", { v: "fast clock" });
		await a.engine.sync();
		await b.engine.sync();

		expect(await b.store.get("apps", "1")).toEqual({ v: "fast clock" });
		expect(await b.store.pending(10)).toHaveLength(0);
	});

	test("pages through large pushes and pulls", async () => {
		const server = fakeServer(150);
		const phone = await device(server.transport).open();
		await Promise.all(
			Array.from({ length: PUSH_BATCH + 50 }, (_, index) =>
				phone.store.put("cards", `c${index}`, { index }),
			),
		);
		await phone.engine.sync();
		expect(server.rows.size).toBe(PUSH_BATCH + 50);

		const tablet = await device(server.transport).open();
		await tablet.engine.sync();
		expect(await tablet.store.list("cards")).toHaveLength(PUSH_BATCH + 50);
	});

	test("failures keep changes pending and report the error", async () => {
		const store = await RecordStore.open(memoryDriver());
		const engine = createSyncEngine({
			store,
			transport: async () => {
				throw new Error("Network request failed");
			},
		});
		await store.put("apps", "1", {});
		await expect(engine.sync()).rejects.toThrow("Network request failed");
		expect(engine.getState()).toMatchObject({ status: "error", error: "Network request failed" });
		expect(await store.pending(10)).toHaveLength(1);
	});

	test("concurrent calls share one run", async () => {
		const server = fakeServer();
		let calls = 0;
		const store = await RecordStore.open(memoryDriver());
		const engine = createSyncEngine({
			store,
			transport: (request) => {
				calls += 1;
				return server.transport(request);
			},
		});
		await Promise.all([engine.sync(), engine.sync(), engine.sync()]);
		expect(calls).toBeLessThanOrEqual(2);
	});
});

const sized = (id: string, size: number) => ({
	collection: "c",
	id,
	data: "x".repeat(size),
	updatedAt: 1,
	deletedAt: null,
});

describe("withinBudget", () => {
	test("stops before the budget and always sends at least one record", () => {
		expect(withinBudget([sized("a", 400), sized("b", 400)], 600)).toHaveLength(1);
		expect(withinBudget([sized("big", 5_000)], 600)).toHaveLength(1);
		expect(withinBudget([sized("a", 10), sized("b", 10)], 600)).toHaveLength(2);
	});
});

describe("claimStore", () => {
	test("keeps data for the same account and clears it for another", async () => {
		const store = await RecordStore.open(memoryDriver());
		await store.put("apps", "1", {});
		await claimStore(store, "user-a");
		expect(await store.list("apps")).toHaveLength(1);
		await claimStore(store, "user-a");
		expect(await store.list("apps")).toHaveLength(1);
		await claimStore(store, "user-b");
		expect(await store.list("apps")).toHaveLength(0);
	});
});
