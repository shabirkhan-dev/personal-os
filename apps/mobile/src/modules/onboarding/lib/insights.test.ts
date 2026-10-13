/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import {
	ageFromBirthday,
	bmi,
	bmiBand,
	dayRhythm,
	insightChips,
	waterGoalLiters,
} from "./insights";
import { formatClock, sleepMinutes } from "./time";

const today = new Date(2026, 9, 13);

describe("insights", () => {
	test("age counts whole years and respects the birthday", () => {
		expect(ageFromBirthday({ day: 12, month: 3, year: 1998 }, today)).toBe(28);
		expect(ageFromBirthday({ day: 14, month: 10, year: 1998 }, today)).toBe(27);
		expect(ageFromBirthday({ day: 13, month: 10, year: 1998 }, today)).toBe(28);
	});

	test("bmi matches the design (175 cm, 72 kg → 23.5, healthy)", () => {
		expect(bmi(175, 72)).toBe(23.5);
		expect(bmiBand(23.5)).toBe("healthy");
		expect(bmiBand(17)).toBe("underweight");
		expect(bmiBand(31)).toBe("obese");
	});

	test("water goal rounds to half litres (72 kg → 2.5 L)", () => {
		expect(waterGoalLiters(72)).toBe(2.5);
		expect(waterGoalLiters(90)).toBe(3);
	});

	test("day rhythm crosses midnight (23:00 → 06:30 = 7h 30m)", () => {
		expect(sleepMinutes(23 * 60, 6 * 60 + 30)).toBe(450);
		expect(dayRhythm(6 * 60 + 30, 23 * 60)).toEqual({
			sleep: "7h 30m",
			morningPlan: "06:45",
			checkIn: "22:30",
		});
		expect(formatClock(-30)).toBe("23:30");
	});

	test("insight chips cover age, bmi, water and sleep", () => {
		const chips = insightChips(
			{
				birthday: { day: 12, month: 3, year: 1998 },
				heightCm: 175,
				weightKg: 72,
				wakeMinutes: 390,
				bedMinutes: 1380,
			},
			today,
		);
		expect(chips.map((chip) => [chip.id, chip.value])).toEqual([
			["age", "28 years"],
			["bmi", "23.5"],
			["water", "2.5 L"],
			["sleep", "7h 30m"],
		]);
	});
});
