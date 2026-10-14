/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { reminderPlans } from "./reminders";

const base = {
	reminders: {
		"morning-plan": true,
		"evening-check-in": true,
		"workout-nudge": true,
		"bill-reminders": true,
	},
	modules: ["daily-life", "workout"] as const,
	wakeMinutes: 6 * 60 + 30,
	bedMinutes: 23 * 60,
	name: "Shabir",
};

describe("reminderPlans", () => {
	test("follows the day the person described", () => {
		expect(reminderPlans(base).map((plan) => [plan.id, plan.hour, plan.minute])).toEqual([
			["morning-plan", 6, 45],
			["evening-check-in", 22, 30],
			["workout-nudge", 18, 30],
		]);
		expect(reminderPlans(base)[0]?.title).toBe("Good morning, Shabir");
	});

	test("wraps a check-in before a midnight bedtime to the evening before", () => {
		const plans = reminderPlans({ ...base, bedMinutes: 15 });
		expect(plans.find((plan) => plan.id === "evening-check-in")).toMatchObject({
			hour: 23,
			minute: 45,
		});
	});

	test("skips reminders that are off or have nothing to remind about", () => {
		const plans = reminderPlans({
			...base,
			modules: ["daily-life"],
			reminders: { ...base.reminders, "morning-plan": false },
		});
		expect(plans.map((plan) => plan.id)).toEqual(["evening-check-in"]);
	});
});
