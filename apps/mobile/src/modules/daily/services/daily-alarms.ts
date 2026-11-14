import { Platform } from "react-native";
import { requestReminderPermission } from "@/modules/onboarding/services/reminders.service";
import type { Planned } from "@/modules/reminders/lib/reminder-plan";
import { syncGroup } from "@/modules/reminders/services/reminder-engine";
import { dailyAlarms } from "../lib/alarms";
import type { DailySettings } from "../lib/daily-model";

/**
 * Daily's alarms as local notifications: a wake-up 10 minutes before Fajr (one-off for the next
 * morning, since Fajr moves), the wind-down nudge every night, and a weekend wake-up. Rescheduled
 * when the app opens, when a toggle changes and by the background task.
 */

export { requestReminderPermission };

export function scheduleDailyAlarms(
	settings: DailySettings,
	fajrMinutes: number | null,
	now = new Date(),
): Promise<number> {
	if (Platform.OS === "web") return Promise.resolve(0);
	const plans: Planned[] = dailyAlarms(settings, fajrMinutes, now).map((alarm, index) => ({
		id: `alarm-${index}`,
		title: alarm.title,
		body: alarm.body,
		when:
			"at" in alarm
				? { at: alarm.at }
				: alarm.weekday === undefined
					? { daily: { hour: alarm.hour, minute: alarm.minute } }
					: { weekly: { weekday: alarm.weekday, hour: alarm.hour, minute: alarm.minute } },
		url: "personalos://",
		actions: "snooze",
		critical: true,
	}));
	return syncGroup("daily", plans);
}
