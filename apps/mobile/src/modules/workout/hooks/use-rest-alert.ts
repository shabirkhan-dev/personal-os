import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { prepareNotifications } from "@/modules/onboarding/services/reminders.service";

const KIND = "personal-os.training-rest";
const CHANNEL_ID = "training";

async function cancelRestAlerts(): Promise<void> {
	const scheduled = await Notifications.getAllScheduledNotificationsAsync();
	await Promise.all(
		scheduled
			.filter((request) => request.content.data?.kind === KIND)
			.map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
	);
}

async function scheduleRestAlert(atMs: number, body: string): Promise<void> {
	await prepareNotifications();
	const { granted } = await Notifications.getPermissionsAsync();
	if (!granted) {
		console.info("[training] notifications are off, so rest ends silently in the background");
		return;
	}
	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
			name: "Training timers",
			importance: Notifications.AndroidImportance.HIGH,
			sound: "default",
		});
	}
	await cancelRestAlerts();
	await Notifications.scheduleNotificationAsync({
		content: {
			title: "Rest over",
			body,
			sound: "default",
			data: { kind: KIND },
		},
		trigger: {
			type: Notifications.SchedulableTriggerInputTypes.DATE,
			date: new Date(atMs),
			channelId: CHANNEL_ID,
		},
	});
}

/**
 * Tells you rest is over when the phone is locked or another app is open: a local notification is
 * scheduled when Training goes to the background mid-rest and cancelled when it comes back, where
 * the live screen speaks the cue itself.
 */
export function useRestAlert(restUntilMs: number | null, body: string): void {
	useEffect(() => {
		if (Platform.OS === "web") return;
		const subscription = AppState.addEventListener("change", (state) => {
			const task =
				state === "active"
					? cancelRestAlerts()
					: restUntilMs !== null && restUntilMs > Date.now()
						? scheduleRestAlert(restUntilMs, body)
						: Promise.resolve();
			task.catch((error: unknown) => console.warn("[training] rest alert failed", error));
		});
		return () => {
			subscription.remove();
			cancelRestAlerts().catch((error: unknown) =>
				console.warn("[training] could not clear the rest alert", error),
			);
		};
	}, [restUntilMs, body]);
}
