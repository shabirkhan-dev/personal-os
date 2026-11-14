import * as Notifications from "expo-notifications";
import { listItems } from "@/lib/db/collection";
import { addWater } from "@/modules/food/data/food-actions";
import { healthDoses, healthMedicines } from "@/modules/health/data/collections";
import { markDose } from "@/modules/health/data/health-actions";
import { scheduleMedicineReminders } from "@/modules/health/services/medicine-reminders";
import { loadReminderSettings } from "../data/collections";
import { dayKeyOf } from "../lib/reminder-plan";
import { snoozeReminder } from "./reminder-engine";

/**
 * What the buttons on a reminder do: Snooze, Taken (medicines) and Log a glass (water). Called
 * from the background task when the app is closed, and from the response listener when it is
 * open; each tap is handled once.
 */

const GLASS_ML = 250;
const handled = new Set<string>();

const asNumber = (value: unknown): number | null =>
	typeof value === "number" ? value : typeof value === "string" && value ? Number(value) : null;

/** True when the tap was a button this app handles (so it shouldn't also open a screen). */
export async function handleReminderAction(
	response: Notifications.NotificationResponse,
): Promise<boolean> {
	const action = response.actionIdentifier;
	if (action === Notifications.DEFAULT_ACTION_IDENTIFIER) return false;
	if (!["snooze", "taken", "glass"].includes(action)) return false;
	const request = response.notification.request;
	const key = `${request.identifier}:${response.notification.date}:${action}`;
	if (handled.has(key)) return true;
	handled.add(key);

	const data = request.content.data ?? {};
	try {
		if (action === "snooze") {
			const settings = await loadReminderSettings();
			await snoozeReminder(request, settings.snoozeMinutes);
		} else if (action === "taken") {
			await markTaken(String(data.medicineId ?? ""), data.day, asNumber(data.minutes));
		} else {
			await addWater(GLASS_ML);
		}
	} catch (error) {
		handled.delete(key);
		console.error(`[reminders] the ${action} button failed`, error);
		throw error;
	} finally {
		await Notifications.dismissNotificationAsync(request.identifier).catch((error: unknown) =>
			console.warn("[reminders] could not clear the notification", error),
		);
	}
	return true;
}

async function markTaken(medicineId: string, day: unknown, minutes: number | null): Promise<void> {
	const medicines = await listItems(healthMedicines);
	const medicine = medicines.find((item) => item.id === medicineId);
	if (!medicine || minutes === null) return;
	const dayKey = typeof day === "string" && day ? day : dayKeyOf(new Date());
	await markDose(medicine, dayKey, minutes, "taken");
	// The follow-up for this dose goes once the dose is marked.
	await scheduleMedicineReminders(medicines, await listItems(healthDoses));
}
