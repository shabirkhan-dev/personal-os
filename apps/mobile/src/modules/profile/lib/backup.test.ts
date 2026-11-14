import { describe, expect, test } from "bun:test";
import {
	backupsToPrune,
	collectionLabel,
	localPhotoPaths,
	parseBackup,
	planRestore,
	rewriteRoot,
	safeRelativePath,
	summarize,
} from "./backup";

const ROOT = "file:///data/user/0/app/files/";

const backup = (extra: Record<string, unknown> = {}) =>
	JSON.stringify({
		app: "Personal OS",
		format: 3,
		exportedAt: "2026-11-14T08:00:00.000Z",
		appVersion: "0.5.0",
		answers: { name: "Sara" },
		preferences: { theme: "dark" },
		modules: { finance: null },
		records: {
			"food-meals": [{ id: "m1", photo: `${ROOT}meal-photos/a.jpg` }, { id: "m2" }],
			"BAD name": [{ id: "x" }],
		},
		photos: { "meal-photos/a.jpg": "AAAA", "../etc/passwd": "AAAA" },
		photoRoot: ROOT,
		...extra,
	});

describe("backup files", () => {
	test("reads a backup and drops anything unsafe", () => {
		const parsed = parseBackup(backup());
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(Object.keys(parsed.file.records)).toEqual(["food-meals"]);
		expect(Object.keys(parsed.file.photos ?? {})).toEqual(["meal-photos/a.jpg"]);
		expect(parsed.file.preferences.theme).toBe("dark");
	});

	test("explains what's wrong with a file that isn't a backup", () => {
		expect(parseBackup("{oops")).toEqual({
			ok: false,
			reason: "This file isn't a Personal OS backup (it isn't valid JSON).",
		});
		expect(parseBackup(JSON.stringify({ app: "Other" })).ok).toBe(false);
		const newer = parseBackup(backup({ format: 9 }));
		expect(newer.ok ? "" : newer.reason).toContain("newer version");
	});

	test("finds photos on the phone and moves their links to a new phone", () => {
		const records = {
			meals: [{ id: "a", photo: `${ROOT}meal-photos/a.jpg`, other: "https://x/y.jpg" }],
		};
		expect(localPhotoPaths(records, ROOT)).toEqual(["meal-photos/a.jpg"]);
		const moved = rewriteRoot(records, ROOT, "file:///new/files/");
		expect(moved.meals[0]?.photo).toBe("file:///new/files/meal-photos/a.jpg");
		expect(moved.meals[0]?.other).toBe("https://x/y.jpg");
		expect(safeRelativePath("a/../../b")).toBe(false);
		expect(safeRelativePath("/abs.jpg")).toBe(false);
	});
});

describe("restoring", () => {
	const fromBackup = { meals: [{ id: "a" }, { id: "b" }], notes: [{ nope: 1 }] };
	const onPhone = { meals: [{ id: "b" }, { id: "c" }], water: [{ id: "w" }] };

	test("merge writes what's in the backup and keeps the rest", () => {
		const plan = planRestore(fromBackup, onPhone, "merge");
		expect(plan.puts.map((put) => put.id)).toEqual(["a", "b"]);
		expect(plan.removes).toEqual([]);
	});

	test("replace also deletes what the backup doesn't have", () => {
		const plan = planRestore(fromBackup, onPhone, "replace");
		expect(plan.removes).toEqual([
			{ collection: "meals", id: "c" },
			{ collection: "water", id: "w" },
		]);
	});
});

describe("the preview and the daily folder", () => {
	test("summarizes a backup", () => {
		const parsed = parseBackup(backup());
		if (!parsed.ok) throw new Error("expected a backup");
		const summary = summarize(parsed.file);
		expect(summary.records).toBe(2);
		expect(summary.photos).toBe(1);
		expect(summary.largest).toEqual([{ name: "food-meals", count: 2 }]);
		expect(collectionLabel("food-meals")).toBe("Food · meals");
	});

	test("keeps the newest seven daily backups", () => {
		const names = Array.from(
			{ length: 9 },
			(_, index) => `personal-os-backup-2026-11-0${index + 1}.json`,
		);
		expect(backupsToPrune([...names, "notes.txt"])).toEqual([
			"personal-os-backup-2026-11-02.json",
			"personal-os-backup-2026-11-01.json",
		]);
	});
});
