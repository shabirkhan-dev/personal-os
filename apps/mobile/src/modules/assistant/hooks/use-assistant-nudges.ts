import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { handleReminderAction } from "@/modules/reminders/services/reminder-actions";
import { pathOf } from "../lib/nudges";

/** Taps already followed, so the tap that opened the app is not followed again. */
const opened = new Set<string>();

/**
 * Opens the screen a tapped notification points to, also when the tap started the app. Only the
 * app's own links are followed.
 */
export function useNotificationLinks() {
	useEffect(() => {
		if (Platform.OS === "web") return;
		const open = (response: Notifications.NotificationResponse | null) => {
			if (!response) return;
			// A daily nudge keeps its identifier, so the delivery time tells one day's tap from the next.
			const id = `${response.notification.request.identifier}:${response.notification.date}`;
			if (opened.has(id)) return;
			opened.add(id);
			if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
				handleReminderAction(response).catch((error: unknown) =>
					console.warn("[notifications] a reminder button failed", error),
				);
				return;
			}
			const path = pathOf(response.notification.request.content.data?.url);
			if (path) router.push(path as Parameters<typeof router.push>[0]);
		};
		Notifications.getLastNotificationResponseAsync()
			.then(open)
			.catch((error: unknown) =>
				console.warn("[notifications] could not read the opening tap", error),
			);
		const subscription = Notifications.addNotificationResponseReceivedListener(open);
		return () => subscription.remove();
	}, []);
}
