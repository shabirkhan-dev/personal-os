/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { buildDayPlan, type PlanInput, planHighlights, rhythmSegments } from "./plan";

const input: PlanInput = {
	wakeMinutes: 390,
	bedMinutes: 1380,
	workStartMinutes: 540,
	workEndMinutes: 1080,
	workStyle: "hybrid",
	workdays: [true, true, true, true, true, false, false],
	modules: ["daily-life", "workout", "finance", "skincare"],
	weightKg: 72,
	calories: 1950,
};

describe("plan", () => {
	test("day plan matches the plan reveal frame", () => {
		expect(buildDayPlan(input).map((row) => [row.time, row.title, row.meta])).toEqual([
			["06:30", "Wake up", "Morning plan at 06:45"],
			["09:00", "Work · Hybrid", "Until 18:00"],
			["13:00", "Lunch", "~650 kcal"],
			["18:30", "Push day", "45 min"],
			["22:00", "Skincare · PM", "4 steps"],
			["23:00", "Sleep", "7h 30m"],
		]);
	});

	test("highlights follow the enabled modules", () => {
		expect(planHighlights(input).map((tile) => tile.value)).toEqual(["Rs 8,000", "3×", "2.5 L"]);
		expect(planHighlights({ ...input, modules: ["daily-life"] }).map((tile) => tile.label)).toEqual(
			["water / day"],
		);
	});

	test("sleep splits across midnight on the rhythm bar", () => {
		const ids = rhythmSegments(input).map((segment) => segment.id);
		expect(ids).toEqual(["sleep-early", "sleep-late", "work", "workout", "plan"]);
	});
});
