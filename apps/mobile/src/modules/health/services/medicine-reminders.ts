import { Platform } from "react-native";
import { listItems } from "@/lib/db/collection";
import { requestReminderPermission } from "@/modules/onboarding/services/reminders.service";
import { loadReminderSettings } from "@/modules/reminders/data/collections";
import { followUpPlans, hm, type Planned } from "@/modules/reminders/lib/reminder-plan";
import { syncGroup } from "@/modules/reminders/services/reminder-engine";
import { healthDoses, healthMedicines } from "../data/collections";
import type { DoseLog, Medicine } from "../lib/health-model";

/**
 * A daily reminder at each dose time of each medicine you're taking, with Taken and Snooze
 * buttons, and a follow-up when a dose isn't marked. Re-planned whenever the medicines or the
 * dose log change; nothing is shown without notification permission.
 */

/** Follow-ups are planned this many days ahead (one-off reminders count against iOS's limit). */
const FOLLOW_UP_DAYS = Platform.OS === "ios" ? 1 : 3;

/** Asks for notification permission, then schedules every medicine's reminders at once. */
export async function allowMedicineReminders(): Promise<void> {
	if (!(await requestReminderPermission())) return;
	await scheduleMedicineReminders(await listItems(healthMedicines), await listItems(healthDoses));
}

export async function scheduleMedicineReminders(
	medicines: readonly Medicine[],
	doses: readonly DoseLog[],
	now = new Date(),
): Promise<number> {
	if (Platform.OS === "web") return 0;
	const settings = await loadReminderSettings();
	const times = medicines
		.filter((medicine) => medicine.active)
		.flatMap((medicine) => medicine.times.map((minutes) => ({ medicine, minutes })));
	const daily: Planned[] = times.map(({ medicine, minutes }) => ({
		id: `dose-${medicine.id}-${minutes}`,
		title: `Time for ${medicine.name}`,
		body: medicine.dose ? `${medicine.dose}. Tap Taken once you have.` : "Tap Taken once you have.",
		when: { daily: hm(minutes) },
		url: "personalos://health/medicines",
		actions: "medicine",
		critical: true,
		data: { medicineId: medicine.id, minutes },
	}));
	const followUps = followUpPlans({
		settings,
		doses: times.map(({ medicine, minutes }) => ({
			medicineId: medicine.id,
			name: medicine.name,
			minutes,
		})),
		marked: doses,
		now,
		days: FOLLOW_UP_DAYS,
	});
	return syncGroup("medicine", [...daily, ...followUps]);
}
