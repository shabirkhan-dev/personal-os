import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
	prepareNotifications,
	requestReminderPermission,
} from "@/modules/onboarding/services/reminders.service";
import { dailyAlarms } from "../lib/alarms";
import type { DailySettings } from "../lib/daily-model";

/**
 * Daily's alarms as local notifications: a wake-up 10 minutes before Fajr (one-off for the next
 * morning, since Fajr moves), the wind-down nudge every night, and a weekend wake-up. Home
 * reschedules them when it opens and when a toggle changes.
 */

const KIND = "personal-os.daily";
const CHANNEL_ID = "daily";

export { requestReminderPermission };

let lastPlan = "";

export async function scheduleDailyAlarms(
	settings: DailySettings,
	fajrMinutes: number | null,
	now = new Date(),
): Promise<number> {
	if (Platform.OS === "web") return 0;
	const plan = dailyAlarms(settings, fajrMinutes, now);
	const key = JSON.stringify(
		plan.map((alarm) =>
			"at" in alarm ? alarm.at.getTime() : [alarm.hour, alarm.minute, alarm.weekday],
		),
	);
	if (key === lastPlan) return plan.length;
	await prepareNotifications();
	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
			name: "Daily alarms",
			importance: Notifications.AndroidImportance.HIGH,
			sound: "default",
		});
	}
	const scheduled = await Notifications.getAllScheduledNotificationsAsync();
	await Promise.all(
		scheduled
			.filter((request) => request.content.data?.kind === KIND)
			.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
	);
	const { granted } = await Notifications.getPermissionsAsync();
	if (!granted) {
		lastPlan = "";
		return 0;
	}
	await Promise.all(
		plan.map((alarm) =>
			Notifications.scheduleNotificationAsync({
				content: {
					title: alarm.title,
					body: alarm.body,
					sound: "default",
					data: { kind: KIND, url: "personalos://" },
				},
				trigger:
					"at" in alarm
						? {
								type: Notifications.SchedulableTriggerInputTypes.DATE,
								date: alarm.at,
								channelId: CHANNEL_ID,
							}
						: alarm.weekday === undefined
							? {
									type: Notifications.SchedulableTriggerInputTypes.DAILY,
									hour: alarm.hour,
									minute: alarm.minute,
									channelId: CHANNEL_ID,
								}
							: {
									type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
									weekday: alarm.weekday,
									hour: alarm.hour,
									minute: alarm.minute,
									channelId: CHANNEL_ID,
								},
			}),
		),
	);
	lastPlan = key;
	return plan.length;
}
