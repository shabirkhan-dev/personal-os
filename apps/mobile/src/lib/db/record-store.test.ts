/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { RecordStore } from "./record-store";
import { memoryDriver } from "./testing/bun-driver";

function clock(start = 1_000) {
	let now = start;
	return { now: () => now, set: (value: number) => (now = value) };
}

async function openStore(time = clock()) {
	return { store: await RecordStore.open(memoryDriver(), time.now), time };
}

describe("RecordStore", () => {
	test("puts, lists and gets documents per collection", async () => {
		const { store } = await openStore();
		await store.put("notes", "a", { text: "one" });
		await store.put("notes", "b", { text: "two" });
		await store.put("other", "a", { text: "elsewhere" });

		expect(await store.list("notes")).toHaveLength(2);
		expect(await store.get("notes", "a")).toEqual({ text: "one" });
		expect(await store.get("other", "a")).toEqual({ text: "elsewhere" });
		expect(await store.get("notes", "missing")).toBeNull();
	});

	test("deletes leave a tombstone that syncs", async () => {
		const { store } = await openStore();
		await store.put("notes", "a", { text: "one" });
		await store.remove("notes", "a");

		expect(await store.list("notes")).toHaveLength(0);
		const [pending] = await store.pending(10);
		expect(pending?.deletedAt).not.toBeNull();
	});

	test("versions keep increasing when the clock steps back", async () => {
		const { store, time } = await openStore(clock(5_000));
		await store.put("notes", "a", { v: 1 });
		time.set(1_000);
		await store.put("notes", "a", { v: 2 });
		const [pending] = await store.pending(10);
		expect(pending?.updatedAt).toBe(5_001);
	});

	test("markSynced keeps a record dirty if it changed during the push", async () => {
		const { store, time } = await openStore();
		await store.put("notes", "a", { v: 1 });
		const pushed = await store.pending(10);
		time.set(2_000);
		await store.put("notes", "a", { v: 2 });
		await store.markSynced(pushed);
		expect(await store.pending(10)).toHaveLength(1);
	});

	test("remote changes apply unless a newer local edit exists", async () => {
		const { store, time } = await openStore(clock(10_000));
		await store.put("notes", "local-newer", { v: "mine" });
		await store.applyRemote([
			{
				collection: "notes",
				id: "local-newer",
				data: { v: "theirs" },
				updatedAt: 9_000,
				deletedAt: null,
			},
			{
				collection: "notes",
				id: "fresh",
				data: { v: "theirs" },
				updatedAt: 9_000,
				deletedAt: null,
			},
		]);
		expect(await store.get("notes", "local-newer")).toEqual({ v: "mine" });
		expect(await store.get("notes", "fresh")).toEqual({ v: "theirs" });

		time.set(20_000);
		await store.applyRemote([
			{
				collection: "notes",
				id: "local-newer",
				data: { v: "theirs" },
				updatedAt: 30_000,
				deletedAt: 30_000,
			},
		]);
		expect(await store.get("notes", "local-newer")).toBeNull();
		expect(await store.pending(10)).toHaveLength(0);
	});

	test("tells subscribers which collections changed", async () => {
		const { store } = await openStore();
		const seen: string[][] = [];
		const stop = store.subscribe((collections) => seen.push([...collections]));
		await store.put("notes", "a", {});
		stop();
		await store.put("notes", "b", {});
		expect(seen).toEqual([["notes"]]);
	});

	test("a failed write rolls back and later writes still run", async () => {
		const { store } = await openStore();
		const circular: Record<string, unknown> = {};
		circular.self = circular;
		await expect(store.put("notes", "bad", circular)).rejects.toThrow();
		await store.put("notes", "good", { ok: true });
		expect(await store.list("notes")).toEqual([{ ok: true }]);
	});

	test("clear removes records and meta", async () => {
		const { store } = await openStore();
		await store.put("notes", "a", {});
		await store.setMeta("cursor", "5");
		await store.clear();
		expect(await store.list("notes")).toHaveLength(0);
		expect(await store.getMeta("cursor")).toBeNull();
	});

	test("reopening keeps the schema version", async () => {
		const driver = memoryDriver();
		const first = await RecordStore.open(driver);
		await first.put("notes", "a", { v: 1 });
		const second = await RecordStore.open(driver);
		expect(await second.get("notes", "a")).toEqual({ v: 1 });
	});
});
