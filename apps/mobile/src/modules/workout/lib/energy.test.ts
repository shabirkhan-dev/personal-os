/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { energyDay } from "./energy";

const now = new Date(2026, 9, 14, 21, 26);
const at = (hour: number, minute: number, level: number) => ({
	id: `${hour}:${minute}`,
	at: new Date(2026, 9, 14, hour, minute).toISOString(),
	level,
});

describe("energyDay", () => {
	test("empty day", () => {
		const day = energyDay([], now);
		expect(day.latest).toBeNull();
		expect(day.candles).toEqual([]);
		expect(day.low).toBeNull();
	});
	test("candles per hour, low, peak and latest", () => {
		const day = energyDay(
			[
				at(14, 10, 60),
				at(8, 0, 41),
				at(8, 40, 55),
				at(11, 0, 93),
				{ id: "y", at: new Date(2026, 9, 13, 10).toISOString(), level: 5 },
				at(21, 0, 72),
			],
			now,
		);
		expect(day.candles).toEqual([
			{ hour: 8, low: 41, high: 55 },
			{ hour: 11, low: 93, high: 93 },
			{ hour: 14, low: 60, high: 60 },
			{ hour: 21, low: 72, high: 72 },
		]);
		expect(day.latest?.level).toBe(72);
		expect(day.low).toBe(41);
		expect(day.lowHour).toBe(8);
		expect(day.peak).toBe(93);
		expect(day.peakHour).toBe(11);
	});
});
