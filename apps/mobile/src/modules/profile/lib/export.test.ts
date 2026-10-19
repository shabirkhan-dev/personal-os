/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { buildExport, exportFileName, exportJson, savedDocumentCount } from "./export";
import { parseProfile } from "./profile-document";

describe("data export", () => {
	const exportedAt = new Date(2026, 9, 14, 9, 30);

	test("collects answers, preferences and every module document", () => {
		const file = buildExport({
			exportedAt,
			appVersion: "1.0",
			answers: { name: "Sara", modules: ["finance"] },
			documents: { workout: null, finance: { expenses: [{ amount: 500 }] } },
			records: { "wishlist-dreams": [{ id: "d1" }], "faith-prayer-logs": [{ id: "p1" }] },
			themePreference: "dark",
		});
		expect(file.app).toBe("Personal OS");
		expect(file.exportedAt).toBe(exportedAt.toISOString());
		expect(file.answers).toEqual({ name: "Sara", modules: ["finance"] });
		expect(file.preferences).toEqual({ theme: "dark" });
		expect(Object.keys(file.modules)).toEqual(["finance", "workout"]);
		expect(file.modules.workout).toBeNull();
		expect(Object.keys(file.records)).toEqual(["faith-prayer-logs", "wishlist-dreams"]);
		expect(JSON.parse(exportJson(file))).toEqual(file);
	});

	test("names the file by local date", () => {
		expect(exportFileName(exportedAt)).toBe("personal-os-2026-10-14.json");
	});

	test("counts documents with data", () => {
		expect(savedDocumentCount({ a: null, b: {}, c: [] })).toBe(2);
		expect(savedDocumentCount({ a: null }, { notes: [{}, {}], other: [{}] })).toBe(3);
	});
});

describe("profile document", () => {
	test("falls back to Monday", () => {
		expect(parseProfile(null)).toEqual({ weekStart: "monday" });
		expect(parseProfile({ weekStart: "friday" })).toEqual({ weekStart: "monday" });
		expect(parseProfile({ weekStart: "sunday" })).toEqual({ weekStart: "sunday" });
	});
});
