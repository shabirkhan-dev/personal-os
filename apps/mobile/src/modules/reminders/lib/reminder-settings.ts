import { asBoolean, asNumber, isRecord } from "@personal-os/domain/parse";

/**
 * How reminders behave across the app, plus the reminders that belong to no single screen (Care
 * routines, water). Prayer, medicine and daily alarm times stay with their own modules.
 */
export type TimedReminder = { on: boolean; minutes: number };

export type ReminderSettings = {
	id: "settings";
	/** Android: deliver important reminders as alarm clocks, so battery savers can't delay them. */
	exact: boolean;
	/** Ask again when a medicine isn't marked taken. */
	followUps: boolean;
	followUpMinutes: number;
	snoozeMinutes: number;
	care: { morning: TimedReminder; night: TimedReminder };
	water: { on: boolean; every: number; from: number; to: number };
	/** A Sunday nudge to look back at the week; off until the person turns it on. */
	review: TimedReminder;
};

const DAY = 24 * 60;

export const FOLLOW_UP_CHOICES = [15, 30, 60] as const;
export const SNOOZE_CHOICES = [5, 10, 15, 30] as const;
export const WATER_EVERY_CHOICES = [60, 90, 120, 180] as const;

export function defaultReminderSettings(): ReminderSettings {
	return {
		id: "settings",
		exact: true,
		followUps: true,
		followUpMinutes: 30,
		snoozeMinutes: 10,
		care: {
			morning: { on: false, minutes: 7 * 60 + 30 },
			night: { on: false, minutes: 22 * 60 },
		},
		water: { on: false, every: 120, from: 9 * 60, to: 21 * 60 },
		review: { on: false, minutes: 19 * 60 },
	};
}

const clock = (value: unknown, fallback: number) => {
	const minutes = Math.round(asNumber(value, fallback));
	return minutes >= 0 && minutes < DAY ? minutes : fallback;
};
const choice = (value: unknown, choices: readonly number[], fallback: number) => {
	const number = asNumber(value, fallback);
	return choices.includes(number) ? number : fallback;
};

function timed(raw: unknown, fallback: TimedReminder): TimedReminder {
	if (!isRecord(raw)) return fallback;
	return { on: asBoolean(raw.on, fallback.on), minutes: clock(raw.minutes, fallback.minutes) };
}

export function parseReminderSettings(raw: unknown): ReminderSettings | null {
	if (!isRecord(raw)) return null;
	const base = defaultReminderSettings();
	const care = isRecord(raw.care) ? raw.care : {};
	const water = isRecord(raw.water) ? raw.water : {};
	return {
		id: "settings",
		exact: asBoolean(raw.exact, base.exact),
		followUps: asBoolean(raw.followUps, base.followUps),
		followUpMinutes: choice(raw.followUpMinutes, FOLLOW_UP_CHOICES, base.followUpMinutes),
		snoozeMinutes: choice(raw.snoozeMinutes, SNOOZE_CHOICES, base.snoozeMinutes),
		care: {
			morning: timed(care.morning, base.care.morning),
			night: timed(care.night, base.care.night),
		},
		water: {
			on: asBoolean(water.on, base.water.on),
			every: choice(water.every, WATER_EVERY_CHOICES, base.water.every),
			from: clock(water.from, base.water.from),
			to: clock(water.to, base.water.to),
		},
		review: timed(raw.review, base.review),
	};
}

/** "07:30" */
export function clockLabel(minutes: number): string {
	const value = ((Math.round(minutes) % DAY) + DAY) % DAY;
	return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
