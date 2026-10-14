import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { ReminderPlan } from "../lib/reminders";

const CHANNEL_ID = "reminders";
/** Every reminder this app schedules carries this tag, so rescheduling replaces only them. */
const KIND = "personal-os.reminder";

let prepared = false;

async function prepare(): Promise<void> {
	if (prepared) return;
	Notifications.setNotificationHandler({
		handleNotification: async () => ({
			shouldShowBanner: true,
			shouldShowList: true,
			shouldPlaySound: false,
			shouldSetBadge: false,
		}),
	});
	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
			name: "Reminders",
			importance: Notifications.AndroidImportance.DEFAULT,
		});
	}
	prepared = true;
}

/** Asks once; afterwards reports what the person chose. */
export async function requestReminderPermission(): Promise<boolean> {
	await prepare();
	const current = await Notifications.getPermissionsAsync();
	if (current.granted) return true;
	if (!current.canAskAgain) return false;
	const asked = await Notifications.requestPermissionsAsync();
	return asked.granted;
}

/** Replaces this app's scheduled reminders with `plans`. Returns how many were scheduled. */
export async function scheduleReminders(plans: readonly ReminderPlan[]): Promise<number> {
	await prepare();
	const scheduled = await Notifications.getAllScheduledNotificationsAsync();
	await Promise.all(
		scheduled
			.filter((request) => request.content.data?.kind === KIND)
			.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
	);
	if (plans.length === 0) return 0;
	const { granted } = await Notifications.getPermissionsAsync();
	if (!granted) return 0;

	const requests = plans.flatMap((plan) =>
		(plan.weekdays ?? [undefined]).map((weekday) => ({
			content: { title: plan.title, body: plan.body, data: { kind: KIND, reminder: plan.id } },
			trigger:
				weekday === undefined
					? {
							type: Notifications.SchedulableTriggerInputTypes.DAILY,
							hour: plan.hour,
							minute: plan.minute,
							channelId: CHANNEL_ID,
						}
					: {
							type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
							weekday,
							hour: plan.hour,
							minute: plan.minute,
							channelId: CHANNEL_ID,
						},
		})),
	);
	await Promise.all(requests.map((request) => Notifications.scheduleNotificationAsync(request)));
	return requests.length;
}
