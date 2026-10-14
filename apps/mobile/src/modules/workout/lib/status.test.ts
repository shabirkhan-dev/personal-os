/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { workoutStatus } from "./status";
import type { WorkoutSession } from "./types";

const at = (date: Date, durationMin = 30): WorkoutSession => ({
	id: date.toISOString(),
	type: "strength",
	title: "Strength",
	startedAt: date.toISOString(),
	durationMin,
	kcal: 0,
	feel: null,
});
const weekdays = [true, true, true, true, true, false, false];
const restAll = [false, false, false, false, false, false, false];

describe("workoutStatus", () => {
	test("planned session later today", () => {
		expect(workoutStatus([], weekdays, new Date(2026, 9, 14, 9))).toBe("Workout at 18:30");
	});
	test("first workout", () => {
		expect(workoutStatus([], restAll, new Date(2026, 9, 14, 9))).toBe("Log your first workout");
		expect(workoutStatus([], weekdays, new Date(2026, 9, 14, 22))).toBe("Log your first workout");
	});
	test("done today", () => {
		expect(
			workoutStatus([at(new Date(2026, 9, 14, 7), 45)], weekdays, new Date(2026, 9, 14, 9)),
		).toBe("Done today · 45 min");
	});
	test("count this week", () => {
		const list = [at(new Date(2026, 9, 12)), at(new Date(2026, 9, 13)), at(new Date(2026, 9, 1))];
		expect(workoutStatus(list, restAll, new Date(2026, 9, 14, 9))).toBe("2 workouts this week");
		expect(workoutStatus([at(new Date(2026, 9, 1))], restAll, new Date(2026, 9, 14, 9))).toBe(
			"No workouts yet this week",
		);
	});
});
