/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import type { Collection } from "@/lib/db/collection";
import { RecordStore } from "@/lib/db/record-store";
import { memoryDriver } from "@/lib/db/testing/bun-driver";
import { photoTarget, syncPhotos } from "./photo-sync";

type Thing = { id: string; photo: string | null };
const parse = (raw: unknown): Thing | null =>
	typeof raw === "object" && raw !== null && "id" in raw ? (raw as Thing) : null;
const things: Collection<Thing> = { name: "things", parse };
const save = (store: RecordStore, item: Thing) => store.put("things", item.id, item);
const list = async (store: RecordStore) =>
	(await store.list("things")).flatMap((raw) => parse(raw) ?? []);
const target = photoTarget(
	things,
	(item) => item.photo,
	(item, photo) => ({ ...item, photo }),
);

async function seeded() {
	const store = await RecordStore.open(memoryDriver(), () => 1_000);
	await save(store, { id: "a", photo: "file:///docs/a.jpg" });
	await save(store, { id: "b", photo: "https://cdn.example/media/u/b.jpg" });
	await save(store, { id: "c", photo: null });
	await save(store, { id: "d", photo: "file:///docs/d.jpg" });
	return store;
}

describe("photo sync", () => {
	test("uploads only photos still on the phone and points the record at the copy", async () => {
		const store = await seeded();
		const uploads: string[] = [];
		const kept: string[] = [];
		const result = await syncPhotos(
			[target],
			async (uri) => {
				uploads.push(uri);
				return uri.replace("file:///docs/", "https://cdn.example/media/u/");
			},
			store,
			(local) => kept.push(local),
		);
		expect(result).toEqual({ uploaded: 2, failed: 0 });
		expect(uploads).toEqual(["file:///docs/a.jpg", "file:///docs/d.jpg"]);
		expect(kept).toEqual(uploads);
		const photos = (await list(store)).map((item) => item.photo);
		expect(photos.every((photo) => photo === null || photo.startsWith("https://"))).toBe(true);
	});

	test("a failed upload is left for next time and the rest still go", async () => {
		const store = await seeded();
		const result = await syncPhotos(
			[target],
			async (uri) => {
				if (uri.endsWith("a.jpg")) throw new Error("offline");
				return "https://cdn.example/media/u/d.jpg";
			},
			store,
		);
		expect(result).toEqual({ uploaded: 1, failed: 1 });
		const a = (await list(store)).find((item) => item.id === "a");
		expect(a?.photo).toBe("file:///docs/a.jpg");
	});

	test("leaves a record alone when its photo changed during the upload", async () => {
		const store = await seeded();
		const result = await syncPhotos(
			[target],
			async (uri) => {
				await save(store, { id: "a", photo: "file:///docs/new.jpg" });
				return uri.replace("file:///docs/", "https://cdn.example/media/u/");
			},
			store,
		);
		const a = (await list(store)).find((item) => item.id === "a");
		expect(a?.photo).toBe("file:///docs/new.jpg");
		expect(result.uploaded).toBe(1);
	});
});
