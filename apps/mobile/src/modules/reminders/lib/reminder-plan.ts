import type { ReminderSettings } from "./reminder-settings";

/**
 * One notification the engine schedules. `id` is stable within its group, so a follow-up can be
 * cancelled on its own once the thing it asks about is done.
 */
export type ReminderWhen =
	| { at: Date }
	| { daily: { hour: number; minute: number } }
	/** Weekday follows expo-notifications: 1 is Sunday. */
	| { weekly: { weekday: number; hour: number; minute: number } };

export type ReminderAction = "medicine" | "water" | "snooze";

export type Planned = {
	id: string;
	title: string;
	body: string;
	when: ReminderWhen;
	/** The screen a tap opens (`personalos://…`). */
	url?: string;
	/** Which buttons the notification carries. */
	actions?: ReminderAction;
	/** Delivered as an alarm clock on Android when exact timing is on. */
	critical: boolean;
	/** Extra values the action buttons need (a medicine id, a dose time). */
	data?: Record<string, string | number>;
};

const DAY = 24 * 60;

export function hm(minutes: number): { hour: number; minute: number } {
	const value = ((Math.round(minutes) % DAY) + DAY) % DAY;
	return { hour: Math.floor(value / 60), minute: value % 60 };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** "2026-11-14" in local time. */
export function dayKeyOf(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function atMinutes(day: Date, minutes: number): Date {
	const at = new Date(day.getFullYear(), day.getMonth(), day.getDate());
	at.setMinutes(minutes);
	return at;
}

/** Morning and night routine reminders from Care. Nothing when Care has no steps yet. */
export function carePlans(settings: ReminderSettings, hasRoutine: boolean): Planned[] {
	if (!hasRoutine) return [];
	const out: Planned[] = [];
	const { morning, night } = settings.care;
	if (morning.on) {
		out.push({
			id: "care-morning",
			title: "Morning routine",
			body: "A few minutes for your skin before the day starts.",
			when: { daily: hm(morning.minutes) },
			url: "personalos://care/routine?routine=morning",
			actions: "snooze",
			critical: true,
		});
	}
	if (night.on) {
		out.push({
			id: "care-night",
			title: "Night routine",
			body: "Wind down: your night steps are waiting.",
			when: { daily: hm(night.minutes) },
			url: "personalos://care/routine?routine=night",
			actions: "snooze",
			critical: true,
		});
	}
	return out;
}

/** The times a water reminder goes out: every `every` minutes from `from` up to `to`. */
export function waterTimes(settings: ReminderSettings["water"]): number[] {
	if (!settings.on || settings.every <= 0) return [];
	const end = settings.to > settings.from ? settings.to : settings.to + DAY;
	const out: number[] = [];
	for (let minutes = settings.from; minutes <= end && out.length < 16; minutes += settings.every) {
		out.push(minutes % DAY);
	}
	return out;
}

export function waterPlans(settings: ReminderSettings): Planned[] {
	return waterTimes(settings.water).map((minutes) => ({
		id: `water-${minutes}`,
		title: "Time for water",
		body: "A glass now keeps the day on track.",
		when: { daily: hm(minutes) },
		url: "personalos://",
		actions: "water",
		critical: false,
	}));
}

export type DoseTime = { medicineId: string; name: string; minutes: number };
export type TakenDose = { medicineId: string; day: string; minutes: number };

/**
 * A second ask after each dose that isn't marked taken or skipped, as one-off reminders for the
 * next `days` days. The medicine scheduler re-plans whenever a dose is marked, which drops the
 * follow-up for it.
 */
export function followUpPlans(input: {
	settings: ReminderSettings;
	doses: readonly DoseTime[];
	marked: readonly TakenDose[];
	now: Date;
	days: number;
}): Planned[] {
	const { settings, doses, marked, now, days } = input;
	if (!settings.followUps) return [];
	const done = new Set(marked.map((dose) => `${dose.medicineId}|${dose.day}|${dose.minutes}`));
	const out: Planned[] = [];
	for (let offset = 0; offset < days; offset += 1) {
		const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
		const key = dayKeyOf(day);
		for (const dose of doses) {
			if (done.has(`${dose.medicineId}|${key}|${dose.minutes}`)) continue;
			const at = atMinutes(day, dose.minutes + settings.followUpMinutes);
			if (at <= now) continue;
			out.push({
				id: followUpId(dose.medicineId, key, dose.minutes),
				title: `Did you take ${dose.name}?`,
				body: "Tap Taken if you did, or snooze for a few minutes.",
				when: { at },
				url: "personalos://health/medicines",
				actions: "medicine",
				critical: true,
				data: { medicineId: dose.medicineId, day: key, minutes: dose.minutes },
			});
		}
	}
	return out;
}

export const followUpId = (medicineId: string, day: string, minutes: number) =>
	`follow-${medicineId}-${day}-${minutes}`;

/** The soonest `limit` one-off reminders, keeping every repeating one (iOS allows 64 in all). */
export function withinBudget(plans: readonly Planned[], limit: number): Planned[] {
	const repeating = plans.filter((plan) => !("at" in plan.when));
	const once = plans
		.filter((plan): plan is Planned & { when: { at: Date } } => "at" in plan.when)
		.toSorted((a, b) => a.when.at.getTime() - b.when.at.getTime());
	return [...repeating, ...once.slice(0, Math.max(0, limit - repeating.length))];
}
