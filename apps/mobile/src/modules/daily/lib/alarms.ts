import type { DailySettings } from "./daily-model";

/** Daily's alarms as plain data: a one-off before Fajr, the nightly wind-down, weekend wake-ups. */

export type Alarm =
	| { title: string; body: string; at: Date }
	| { title: string; body: string; hour: number; minute: number; weekday?: number };

export function dailyAlarms(
	settings: DailySettings,
	fajrMinutes: number | null,
	now: Date,
): Alarm[] {
	const alarms: Alarm[] = [];
	if (settings.alarms.fajr && fajrMinutes !== null) {
		const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, fajrMinutes - 10);
		if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
		alarms.push({ title: "Fajr soon", body: "Ten minutes to Fajr. Up gently.", at });
	}
	if (settings.alarms.windDown) {
		alarms.push({
			title: "Wind down",
			body: "Phone on the charger, night routine, lights low.",
			hour: Math.floor(settings.windDownAt / 60),
			minute: settings.windDownAt % 60,
		});
	}
	if (settings.alarms.weekend) {
		for (const weekday of [7, 1]) {
			alarms.push({
				title: "Good morning",
				body: "Weekend wake-up.",
				hour: Math.floor(settings.weekendWakeAt / 60),
				minute: settings.weekendWakeAt % 60,
				weekday,
			});
		}
	}
	return alarms;
}
