import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { listItems } from "@/lib/db/collection";
import {
	prepareNotifications,
	requestReminderPermission,
} from "@/modules/onboarding/services/reminders.service";
import { healthMedicines } from "../data/collections";
import type { Medicine } from "../lib/health-model";

/**
 * A daily reminder at each dose time of each medicine you're taking. Rescheduled whenever the
 * medicines change; nothing is shown without notification permission.
 */

const KIND = "personal-os.medicine";
const CHANNEL_ID = "medicines";

let lastPlan = "";

/** Asks for notification permission, then schedules every medicine's reminders at once. */
export async function allowMedicineReminders(): Promise<void> {
	if (!(await requestReminderPermission())) return;
	lastPlan = "";
	await scheduleMedicineReminders(await listItems(healthMedicines));
}

export async function scheduleMedicineReminders(medicines: readonly Medicine[]): Promise<number> {
	if (Platform.OS === "web") return 0;
	const plan = medicines
		.filter((medicine) => medicine.active)
		.flatMap((medicine) => medicine.times.map((minutes) => ({ medicine, minutes })));
	const key = JSON.stringify(
		plan.map((item) => [item.medicine.id, item.medicine.name, item.medicine.dose, item.minutes]),
	);
	if (key === lastPlan) return plan.length;

	await prepareNotifications();
	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
			name: "Medicine reminders",
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
	if (!granted || plan.length === 0) {
		lastPlan = granted ? key : "";
		return 0;
	}
	await Promise.all(
		plan.map(({ medicine, minutes }) =>
			Notifications.scheduleNotificationAsync({
				content: {
					title: `Time for ${medicine.name}`,
					body: medicine.dose ? `${medicine.dose}. Tap to mark it taken.` : "Tap to mark it taken.",
					sound: "default",
					data: { kind: KIND, url: "personalos://health/medicines" },
				},
				trigger: {
					type: Notifications.SchedulableTriggerInputTypes.DAILY,
					hour: Math.floor(minutes / 60),
					minute: minutes % 60,
					channelId: CHANNEL_ID,
				},
			}),
		),
	);
	lastPlan = key;
	return plan.length;
}
