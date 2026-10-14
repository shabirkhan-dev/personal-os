/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { trainingScore, weekBars, weekStart } from "./score";
import type { WorkoutSession } from "./types";

const at = (date: Date, durationMin: number): WorkoutSession => ({
	id: date.toISOString(),
	type: "run",
	title: "Run",
	startedAt: date.toISOString(),
	durationMin,
	kcal: 0,
	feel: null,
});

// Wednesday 14 Oct 2026
const now = new Date(2026, 9, 14, 12);

describe("weekBars", () => {
	test("starts on Sunday", () => {
		expect(weekStart(now).getDate()).toBe(11);
		expect(weekBars([], now).map((bar) => bar.letter)).toEqual(["S", "M", "T", "W", "T", "F", "S"]);
	});
	test("empty week is flat and 0%", () => {
		const bars = weekBars([], now);
		expect(bars.every((bar) => bar.ratio === 0)).toBe(true);
		expect(trainingScore(bars)).toBe(0);
		expect(bars[3]?.isToday).toBe(true);
		expect(bars[4]?.isFuture).toBe(true);
	});
	test("minutes against the target, capped per day", () => {
		const bars = weekBars(
			[
				at(new Date(2026, 9, 12, 18), 60),
				at(new Date(2026, 9, 13, 7), 15),
				at(new Date(2026, 9, 4), 90),
			],
			now,
		);
		expect(bars[1]?.ratio).toBe(1);
		expect(bars[2]?.ratio).toBe(0.5);
		// (1 + 0.5) / 7
		expect(trainingScore(bars)).toBe(21);
	});
});
