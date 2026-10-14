/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { estimateKcal, formatThousands, kcalOn } from "./kcal";
import type { WorkoutSession } from "./types";

const session = (startedAt: string, kcal: number): WorkoutSession => ({
	id: startedAt,
	type: "strength",
	title: "Strength",
	startedAt,
	durationMin: 30,
	kcal,
	feel: null,
});

describe("estimateKcal", () => {
	test("MET × kg × hours", () => {
		expect(estimateKcal("strength", 60, 72)).toBe(360);
		expect(estimateKcal("walk", 30, 80)).toBe(140);
	});
	test("runs use pace when distance is known", () => {
		// 10 km/h ≈ 10 MET
		expect(estimateKcal("run", 30, 70, 5)).toBe(350);
		// Very slow is clamped to 6 MET
		expect(estimateKcal("run", 60, 70, 2)).toBe(420);
	});
	test("nothing for zero minutes or weight", () => {
		expect(estimateKcal("run", 0, 70)).toBe(0);
		expect(estimateKcal("run", 30, 0)).toBe(0);
	});
});

describe("kcalOn", () => {
	test("sums only the given day", () => {
		const list = [
			session(new Date(2026, 9, 14, 7).toISOString(), 200),
			session(new Date(2026, 9, 14, 19).toISOString(), 286),
			session(new Date(2026, 9, 13, 19).toISOString(), 500),
		];
		expect(kcalOn(list, new Date(2026, 9, 14, 21))).toBe(486);
		expect(kcalOn([], new Date())).toBe(0);
	});
});

test("formatThousands", () => {
	expect(formatThousands(486)).toBe("486");
	expect(formatThousands(12480)).toBe("12,480");
});
