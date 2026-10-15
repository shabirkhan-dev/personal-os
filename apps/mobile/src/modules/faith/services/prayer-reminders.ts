import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
	prepareNotifications,
	requestReminderPermission,
	setQuietCheck,
} from "@/modules/onboarding/services/reminders.service";
import type { FaithSettings } from "../lib/faith-model";
import { timesSource } from "../lib/faith-math";
import { dayTimes, PRAYER_LABELS, slots } from "../lib/prayer-times";

/**
 * Prayer reminders as one-off notifications for the next few days, because the times move a
 * little every day. Home reschedules them whenever it opens and whenever the settings change.
 */

const KIND = "personal-os.prayer";
const CHANNEL_ID = "prayers";
const DAYS_AHEAD = 6;
const QUIET_MINUTES = 15;

export { requestReminderPermission };

let lastPlan = "";

/** Replaces Faith's scheduled reminders. Returns how many were scheduled. */
export async function schedulePrayerReminders(
	settings: FaithSettings,
	now = new Date(),
): Promise<number> {
	if (Platform.OS === "web") return 0;
	const plan = upcoming(settings, now);
	updateQuiet(settings, now);
	const key = JSON.stringify(plan.map((item) => [item.at.getTime(), item.title]));
	if (key === lastPlan) return plan.length;

	await ensureChannel();
	const scheduled = await Notifications.getAllScheduledNotificationsAsync();
	await Promise.all(
		scheduled
			.filter((request) => request.content.data?.kind === KIND)
			.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
	);
	const { granted } = await Notifications.getPermissionsAsync();
	if (!granted || plan.length === 0) {
		lastPlan = granted ? key : "";
		return 0;
	}
	await Promise.all(
		plan.map((item) =>
			Notifications.scheduleNotificationAsync({
				content: {
					title: item.title,
					body: item.body,
					sound: "default",
					data: { kind: KIND, url: "personalos://" },
				},
				trigger: {
					type: Notifications.SchedulableTriggerInputTypes.DATE,
					date: item.at,
					channelId: CHANNEL_ID,
				},
			}),
		),
	);
	lastPlan = key;
	return plan.length;
}

async function ensureChannel(): Promise<void> {
	await prepareNotifications();
	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
			name: "Prayer reminders",
			importance: Notifications.AndroidImportance.HIGH,
			sound: "default",
		});
	}
}

type Planned = { at: Date; title: string; body: string };

function upcoming(settings: FaithSettings, now: Date): Planned[] {
	if (!settings.setUp) return [];
	const lead = settings.reminderLead;
	const out: Planned[] = [];
	for (let offset = 0; offset < DAYS_AHEAD; offset += 1) {
		const date = new Date(now);
		date.setDate(date.getDate() + offset);
		for (const slot of slots(dayTimes(timesSource(settings), date), settings.prayers)) {
			if (settings.reminders[slot.prayer] === false) continue;
			const at = new Date(slot.at.getTime() - lead * 60_000);
			if (at <= now) continue;
			const label = PRAYER_LABELS[slot.prayer];
			out.push({
				at,
				title: lead > 0 ? `${label} in ${lead} minutes` : `It's time for ${label}`,
				body: lead > 0 ? "A gentle reminder to get ready." : "Take a moment for your prayer.",
			});
		}
	}
	return out;
}

/** With "Silence notifications" on, the app's own alerts stay quiet for 15 minutes from each prayer. */
function updateQuiet(settings: FaithSettings, now: Date): void {
	if (!settings.silence || !settings.setUp) {
		setQuietCheck(() => false);
		return;
	}
	const windows = slots(dayTimes(timesSource(settings), now), settings.prayers).map((slot) => [
		slot.at.getTime(),
		slot.at.getTime() + QUIET_MINUTES * 60_000,
	]);
	setQuietCheck(() => {
		const t = Date.now();
		return windows.some(([from = 0, to = 0]) => t >= from && t < to);
	});
}

/** One extra nudge (a Fajr alarm, a bedtime reminder). False when notifications are off. */
export async function scheduleOnce(at: Date, title: string, body: string): Promise<boolean> {
	if (Platform.OS === "web" || at <= new Date()) return false;
	if (!(await requestReminderPermission())) return false;
	await ensureChannel();
	await Notifications.scheduleNotificationAsync({
		content: { title, body, sound: "default", data: { kind: `${KIND}.once` } },
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.DATE,
			date: at,
			channelId: CHANNEL_ID,
		},
	});
	return true;
}
