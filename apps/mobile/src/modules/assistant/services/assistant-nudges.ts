import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { prepareNotifications } from "@/modules/onboarding/services/reminders.service";
import type { Nudge } from "../lib/nudges";

/**
 * The assistant's nudges as local notifications. They are planned on the phone from its own
 * records and replaced whenever the plan changes; tapping one opens the assistant with its
 * question asked (see `useNotificationLinks`).
 */

const KIND = "personal-os.assistant";
const CHANNEL_ID = "assistant";

let lastPlan = "";

/** The deep link a nudge opens: the assistant, asked `ask`. */
export function nudgeUrl(ask: string): string {
	return `personalos://assistant?ask=${encodeURIComponent(ask)}`;
}

export async function scheduleNudges(nudges: readonly Nudge[]): Promise<number> {
	if (Platform.OS === "web") return 0;
	const key = JSON.stringify(
		nudges.map((nudge) => [nudge.id, "at" in nudge ? nudge.at.getTime() : nudge.daily]),
	);
	if (key === lastPlan) return nudges.length;
	await prepareNotifications();
	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
			name: "Assistant",
			importance: Notifications.AndroidImportance.DEFAULT,
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
		nudges.map((nudge) =>
			Notifications.scheduleNotificationAsync({
				identifier: `${KIND}.${nudge.id}`,
				content: {
					title: nudge.title,
					body: nudge.body,
					data: { kind: KIND, url: nudgeUrl(nudge.ask) },
				},
				trigger:
					"at" in nudge
						? {
								type: Notifications.SchedulableTriggerInputTypes.DATE,
								date: nudge.at,
								channelId: CHANNEL_ID,
							}
						: {
								type: Notifications.SchedulableTriggerInputTypes.DAILY,
								hour: nudge.daily.hour,
								minute: nudge.daily.minute,
								channelId: CHANNEL_ID,
							},
			}),
		),
	);
	lastPlan = key;
	return nudges.length;
}
