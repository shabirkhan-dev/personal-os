/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { completeRoutine, toggleStep } from "./routine";
import { DEFAULT_ROUTINES, type SkincareDoc } from "./skincare-types";
import { nightRoutineTime, skincareStatus } from "./status";

const empty: SkincareDoc = {
	routines: DEFAULT_ROUTINES,
	completions: {},
	checkIns: [],
	products: [],
};
const bed = 23 * 60;

describe("skincareStatus", () => {
	test("partly done routine", () => {
		const doc = toggleStep(empty, "morning", "am-cleanser", new Date(2026, 9, 14, 7));
		expect(skincareStatus(doc, new Date(2026, 9, 14, 8), bed)).toBe("1 of 4 done");
	});

	test("evening with the night routine to do", () => {
		expect(skincareStatus(empty, new Date(2026, 9, 14, 18), bed)).toBe("PM routine at 22:30");
	});

	test("streak once everything is done", () => {
		let doc = completeRoutine(empty, "morning", new Date(2026, 9, 14, 8));
		doc = completeRoutine(doc, "night", new Date(2026, 9, 14, 22));
		expect(skincareStatus(doc, new Date(2026, 9, 14, 23), bed)).toBe("1 day streak");
	});

	test("fresh morning", () => {
		expect(skincareStatus(empty, new Date(2026, 9, 14, 8), bed)).toBe("AM routine · 4 steps");
	});

	test("night time wraps past midnight", () => {
		expect(nightRoutineTime(15)).toBe("23:45");
	});
});
