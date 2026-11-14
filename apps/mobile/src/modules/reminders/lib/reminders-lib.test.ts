import { describe, expect, it } from "bun:test";
import { nextFire } from "../services/reminder-engine-math";
import {
	carePlans,
	dayKeyOf,
	followUpId,
	followUpPlans,
	type Planned,
	waterTimes,
	withinBudget,
} from "./reminder-plan";
import { defaultReminderSettings, parseReminderSettings } from "./reminder-settings";

const settings = defaultReminderSettings();

const once = (id: string, hour: number): Planned => ({
	id,
	title: id,
	body: "",
	when: { at: new Date(2026, 10, 14, hour) },
	critical: true,
});

describe("reminder settings", () => {
	it("falls back to safe values for anything damaged", () => {
		const parsed = parseReminderSettings({
			followUpMinutes: 7,
			snoozeMinutes: 15,
			care: { morning: { on: true, minutes: 9999 } },
			water: { every: 90 },
		});
		expect(parsed?.followUpMinutes).toBe(30);
		expect(parsed?.snoozeMinutes).toBe(15);
		expect(parsed?.care.morning).toEqual({ on: true, minutes: settings.care.morning.minutes });
		expect(parsed?.water.every).toBe(90);
		expect(parseReminderSettings("nope")).toBeNull();
	});
});

describe("care and water", () => {
	it("plans routine reminders only once there is a routine", () => {
		const on = {
			...settings,
			care: { morning: { on: true, minutes: 450 }, night: { on: true, minutes: 1320 } },
		};
		expect(carePlans(on, false)).toEqual([]);
		const plans = carePlans(on, true);
		expect(plans.map((plan) => plan.when)).toEqual([
			{ daily: { hour: 7, minute: 30 } },
			{ daily: { hour: 22, minute: 0 } },
		]);
		expect(plans.every((plan) => plan.critical)).toBe(true);
	});

	it("spaces water through the waking day, also past midnight", () => {
		expect(waterTimes({ on: true, every: 180, from: 9 * 60, to: 21 * 60 })).toEqual([
			540, 720, 900, 1080, 1260,
		]);
		expect(waterTimes({ on: true, every: 120, from: 22 * 60, to: 60 })).toEqual([1320, 0]);
		expect(waterTimes({ on: false, every: 120, from: 540, to: 1260 })).toEqual([]);
	});
});

describe("medicine follow-ups", () => {
	const now = new Date(2026, 10, 14, 9, 0);
	const doses = [
		{ medicineId: "m1", name: "Metformin", minutes: 8 * 60 },
		{ medicineId: "m1", name: "Metformin", minutes: 20 * 60 },
	];

	it("asks again after each unmarked dose that's still ahead", () => {
		const plans = followUpPlans({ settings, doses, marked: [], now, days: 2 });
		// Today 08:30 has passed; today 20:30, tomorrow 08:30 and 20:30 remain.
		expect(plans.map((plan) => plan.id)).toEqual([
			followUpId("m1", "2026-11-14", 1200),
			followUpId("m1", "2026-11-15", 480),
			followUpId("m1", "2026-11-15", 1200),
		]);
		expect(plans[0]?.when).toEqual({ at: new Date(2026, 10, 14, 20, 30) });
		expect(plans[0]?.data).toEqual({ medicineId: "m1", day: "2026-11-14", minutes: 1200 });
	});

	it("drops the follow-up once a dose is marked, and all of them when turned off", () => {
		const marked = [{ medicineId: "m1", day: "2026-11-14", minutes: 1200 }];
		expect(followUpPlans({ settings, doses, marked, now, days: 1 })).toEqual([]);
		expect(
			followUpPlans({
				settings: { ...settings, followUps: false },
				doses,
				marked: [],
				now,
				days: 3,
			}),
		).toEqual([]);
	});

	it("uses local day keys", () => {
		expect(dayKeyOf(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
	});
});

describe("budget and timing", () => {
	it("keeps repeating reminders and the soonest one-offs", () => {
		const daily: Planned = {
			id: "d",
			title: "d",
			body: "",
			when: { daily: { hour: 8, minute: 0 } },
			critical: false,
		};
		const kept = withinBudget([once("late", 20), daily, once("soon", 10), once("mid", 15)], 3);
		expect(kept.map((plan) => plan.id)).toEqual(["d", "soon", "mid"]);
	});

	it("knows when a scheduled reminder fires next", () => {
		const now = new Date(2026, 10, 14, 9, 0); // a Saturday
		expect(nextFire({ type: "daily", hour: 8, minute: 0 }, now)).toEqual(
			new Date(2026, 10, 15, 8, 0),
		);
		expect(nextFire({ type: "daily", hour: 21, minute: 15 }, now)).toEqual(
			new Date(2026, 10, 14, 21, 15),
		);
		// Weekday 2 is Monday.
		expect(nextFire({ type: "weekly", weekday: 2, hour: 18, minute: 30 }, now)).toEqual(
			new Date(2026, 10, 16, 18, 30),
		);
		expect(nextFire({ type: "date", value: 1_800_000_000_000 }, now)).toEqual(
			new Date(1_800_000_000_000),
		);
		expect(nextFire(null, now)).toBeNull();
	});
});
