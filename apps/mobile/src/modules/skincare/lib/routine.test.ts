/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { dayKey } from "@/lib/day";
import {
	completeRoutine,
	nextStepId,
	routineFor,
	routineStreak,
	routinesInUse,
	setRoutine,
	toggleStep,
} from "./routine";
import { DEFAULT_ROUTINES, type SkincareDoc } from "./skincare-types";

const empty: SkincareDoc = {
	routines: DEFAULT_ROUTINES,
	completions: {},
	checkIns: [],
	products: [],
};
const day = (d: number, h = 8) => new Date(2026, 9, d, h, 0);

function doBoth(doc: SkincareDoc, d: number): SkincareDoc {
	return completeRoutine(completeRoutine(doc, "morning", day(d, 8)), "night", day(d, 22));
}

describe("routineFor", () => {
	test("morning before 15:00, night after", () => {
		expect(routineFor(day(14, 14))).toBe("morning");
		expect(routineFor(day(14, 15))).toBe("night");
	});
});

describe("toggleStep", () => {
	test("records the time and clears it again", () => {
		const on = toggleStep(empty, "morning", "am-cleanser", day(14, 7));
		expect(on.completions["2026-10-14"]?.morning["am-cleanser"]).toBe(day(14, 7).toISOString());
		const off = toggleStep(on, "morning", "am-cleanser", day(14, 7));
		expect(off.completions["2026-10-14"]?.morning["am-cleanser"]).toBeUndefined();
	});

	test("NEXT is the first undone step", () => {
		const doc = toggleStep(empty, "morning", "am-cleanser", day(14));
		expect(nextStepId(doc.routines.morning, doc.completions["2026-10-14"]?.morning ?? {})).toBe(
			"am-vitamin-c",
		);
	});

	test("finishing the last step marks the routine finished", () => {
		let doc = empty;
		for (const step of DEFAULT_ROUTINES.night) doc = toggleStep(doc, "night", step.id, day(14, 22));
		expect(doc.completions["2026-10-14"]?.finished).toEqual(["night"]);
		doc = toggleStep(doc, "night", "pm-treatment", day(14, 22));
		expect(doc.completions["2026-10-14"]?.finished).toEqual([]);
	});
});

describe("routineStreak", () => {
	test("zero with nothing done", () => {
		expect(routineStreak(empty, day(14))).toBe(0);
	});

	test("counts days where both routines were done, ending today", () => {
		let doc = empty;
		for (const d of [11, 12, 13, 14]) doc = doBoth(doc, d);
		expect(routineStreak(doc, day(14))).toBe(4);
	});

	test("ends yesterday when today is not finished yet", () => {
		let doc = empty;
		for (const d of [12, 13]) doc = doBoth(doc, d);
		doc = completeRoutine(doc, "morning", day(14));
		expect(routineStreak(doc, day(14, 10))).toBe(2);
	});

	test("a missed day breaks it", () => {
		let doc = empty;
		for (const d of [10, 12, 13]) doc = doBoth(doc, d);
		expect(routineStreak(doc, day(13))).toBe(2);
	});

	test("a half-done day does not count", () => {
		let doc = doBoth(empty, 12);
		doc = completeRoutine(doc, "morning", day(13));
		doc = doBoth(doc, 14);
		expect(routineStreak(doc, day(14))).toBe(1);
	});

	test("someone who only does mornings counts mornings", () => {
		let doc = empty;
		for (const d of [12, 13, 14]) doc = completeRoutine(doc, "morning", day(d));
		expect(routinesInUse(doc)).toEqual(["morning"]);
		expect(routineStreak(doc, day(14))).toBe(3);
	});

	test("an emptied routine is ignored", () => {
		let doc = doBoth(empty, 13);
		doc = setRoutine(doc, "night", [], day(14));
		doc = completeRoutine(doc, "morning", day(14));
		expect(routineStreak(doc, day(14))).toBe(2);
	});

	test("adding a step later does not rewrite past days", () => {
		let doc = doBoth(empty, 13);
		doc = setRoutine(
			doc,
			"morning",
			[...DEFAULT_ROUTINES.morning, { id: "x", name: "Toner", detail: "" }],
			day(14),
		);
		expect(routineStreak(doc, day(14))).toBe(1);
		expect(dayKey(day(14))).toBe("2026-10-14");
	});
});
