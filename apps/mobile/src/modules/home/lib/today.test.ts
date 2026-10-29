/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import type { PlanInput } from "@/modules/onboarding/lib/plan";
import { moduleStatuses, periodLabel, todayItems } from "./today";

const input: PlanInput = {
	wakeMinutes: 6 * 60 + 30,
	bedMinutes: 23 * 60,
	workStartMinutes: 9 * 60,
	workEndMinutes: 18 * 60,
	workStyle: "hybrid",
	workdays: [true, true, true, true, true, false, false],
	modules: ["daily-life", "workout"],
	weightKg: 72,
	calories: 2100,
};

const allReminders = {
	"morning-plan": true,
	"evening-check-in": true,
	"workout-nudge": true,
	"bill-reminders": true,
};

describe("today", () => {
	test("merges plan rows and reminders in time order", () => {
		const items = todayItems(input, allReminders);
		expect(items.map((item) => item.time)).toEqual([
			"06:30",
			"06:45",
			"09:00",
			"13:00",
			"18:30",
			"22:30",
			"23:00",
		]);
		expect(items.find((item) => item.title === "Evening check-in")?.time).toBe("22:30");
	});

	test("works without ES2023 array methods, as on Hermes", () => {
		const prototype = Array.prototype as { toSorted?: unknown };
		const toSorted = prototype.toSorted;
		delete prototype.toSorted;
		try {
			expect(todayItems(input, allReminders)).toHaveLength(7);
		} finally {
			prototype.toSorted = toSorted;
		}
	});

	test("skips reminders that are off", () => {
		const items = todayItems(input, { ...allReminders, "evening-check-in": false });
		expect(items.some((item) => item.title === "Evening check-in")).toBe(false);
	});

	test("module statuses come from the plan", () => {
		const statuses = moduleStatuses(input, todayItems(input, allReminders));
		expect(statuses.find((status) => status.id === "workout")).toMatchObject({
			status: "Push day at 18:30",
			enabled: true,
		});
		expect(statuses.find((status) => status.id === "finance")?.enabled).toBe(false);
		expect(statuses.find((status) => status.id === "daily-life")?.status).toBe(
			"7 things planned today",
		);
	});

	test("labels", () => {
		const date = new Date(2026, 9, 13, 16, 20);
		expect(periodLabel(date)).toBe("PKR · OCT");
	});
});
