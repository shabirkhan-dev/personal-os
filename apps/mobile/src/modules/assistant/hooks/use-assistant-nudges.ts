import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useCollection } from "@/lib/db/collection";
import { applications } from "@/modules/career/data/collections";
import { financeBills } from "@/modules/finance/data/collections";
import { useAssistantSettings } from "../data/assistant-settings";
import { pathOf, planNudges } from "../lib/nudges";
import { scheduleNudges } from "../services/assistant-nudges";

/** Keeps the assistant's nudges planned from the latest bills, applications and settings. */
export function useAssistantNudges() {
	const { loading, settings } = useAssistantSettings();
	const bills = useCollection(financeBills);
	const apps = useCollection(applications);
	const ready = !loading && !bills.isPending && !apps.isPending;

	useEffect(() => {
		if (!ready) return;
		const nudges = planNudges({
			settings,
			bills: bills.data ?? [],
			applications: apps.data ?? [],
			now: new Date(),
		});
		scheduleNudges(nudges).catch((error: unknown) =>
			console.warn("[assistant] could not schedule nudges", error),
		);
	}, [ready, settings, bills.data, apps.data]);
}

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
