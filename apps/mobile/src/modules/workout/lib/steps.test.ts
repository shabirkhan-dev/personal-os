/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { barHeights, lastDays, stepsToKm, strideMeters } from "./steps";

describe("steps", () => {
	test("stride from height, with a fallback", () => {
		expect(strideMeters(175)).toBeCloseTo(0.72625);
		expect(strideMeters(0)).toBe(0.75);
		expect(stepsToKm(10000, 0)).toBe(7.5);
	});
	test("last days end today, oldest first", () => {
		const days = lastDays(new Date(2026, 9, 2, 15), 9);
		expect(days).toHaveLength(9);
		expect(days[8]?.getDate()).toBe(2);
		expect(days[0]?.getMonth()).toBe(8);
		expect(days[0]?.getDate()).toBe(24);
		expect(days[8]?.getHours()).toBe(0);
	});
	test("bar heights scale to the busiest day", () => {
		expect(barHeights([0, 5000, 10000], 100, 12)).toEqual([12, 50, 100]);
		expect(barHeights([0, 0], 100, 12)).toEqual([12, 12]);
	});
});
