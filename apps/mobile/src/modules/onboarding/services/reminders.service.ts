import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { ReminderPlan } from "../lib/reminders";

const CHANNEL_ID = "reminders";

let prepared = false;
let isQuiet: () => boolean = () => false;

/** Lets a module hold this app's alerts back for a while (Faith: 15 minutes from each prayer). */
export function setQuietCheck(check: () => boolean): void {
	isQuiet = check;
}

export async function prepareNotifications(): Promise<void> {
	if (prepared) return;
	Notifications.setNotificationHandler({
		handleNotification: async () => {
			const quiet = isQuiet();
			return {
				shouldShowBanner: !quiet,
				shouldShowList: true,
				shouldPlaySound: false,
				shouldSetBadge: false,
			};
		},
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
	await prepareNotifications();
	const current = await Notifications.getPermissionsAsync();
	if (current.granted) return true;
	if (!current.canAskAgain) return false;
	const asked = await Notifications.requestPermissionsAsync();
	return asked.granted;
}

/** Replaces the setup reminders (morning plan, evening check-in…). Returns how many were scheduled. */
export async function scheduleReminders(plans: readonly ReminderPlan[]): Promise<number> {
	const { syncGroup } = await import("@/modules/reminders/services/reminder-engine");
	return syncGroup(
		"reminder",
		plans.flatMap((plan) =>
			(plan.weekdays ?? [undefined]).map((weekday) => ({
				id: weekday === undefined ? plan.id : `${plan.id}-${weekday}`,
				title: plan.title,
				body: plan.body,
				when:
					weekday === undefined
						? { daily: { hour: plan.hour, minute: plan.minute } }
						: { weekly: { weekday, hour: plan.hour, minute: plan.minute } },
				url: "personalos://",
				actions: "snooze" as const,
				critical: false,
			})),
		),
	);
}
