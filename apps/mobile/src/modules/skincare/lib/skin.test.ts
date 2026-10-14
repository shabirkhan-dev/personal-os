/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { breakoutsLabel, checkedAgoLabel, latestCheckIn, skinTip } from "./skin";
import { type CheckIn, DEFAULT_ROUTINES, type SkincareDoc } from "./skincare-types";

const now = new Date(2026, 9, 14, 9, 0);
const check = (dayKey: string, extra: Partial<CheckIn> = {}): CheckIn => ({
	id: dayKey,
	dayKey,
	hydration: "good",
	redness: "low",
	breakouts: 0,
	...extra,
});
const doc = (over: Partial<SkincareDoc> = {}): SkincareDoc => ({
	routines: DEFAULT_ROUTINES,
	completions: {},
	checkIns: [],
	products: [],
	...over,
});

const text = (d: SkincareDoc) =>
	skinTip(d)
		.map((p) => p.text)
		.join("");

describe("check-ins", () => {
	test("latest and how long ago", () => {
		const latest = latestCheckIn([check("2026-10-09"), check("2026-10-11"), check("2026-10-10")]);
		expect(latest?.dayKey).toBe("2026-10-11");
		expect(checkedAgoLabel(latest, now)).toBe("Checked 3 days ago");
		expect(checkedAgoLabel(check("2026-10-14"), now)).toBe("Checked today");
		expect(checkedAgoLabel(null, now)).toBe("Not checked yet");
	});

	test("breakouts", () => {
		expect(breakoutsLabel(0)).toBe("None");
		expect(breakoutsLabel(1)).toBe("1 new");
	});
});

describe("skinTip", () => {
	test("sunscreen in the routine → reapply tip, never a UV index", () => {
		expect(text(doc())).toContain("Reapply sunscreen every 2 hours outdoors");
		expect(text(doc())).not.toMatch(/UV/);
	});

	test("high redness wins", () => {
		expect(text(doc({ checkIns: [check("2026-10-13", { redness: "high" })] }))).toContain(
			"Redness was high",
		);
	});

	test("no sunscreen but actives at night", () => {
		const routines = { morning: [], night: DEFAULT_ROUTINES.night };
		expect(text(doc({ routines }))).toContain("Add sunscreen");
	});
});
