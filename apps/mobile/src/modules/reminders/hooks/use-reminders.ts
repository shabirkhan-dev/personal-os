import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { useCollection } from "@/lib/db/collection";
import { careSteps } from "@/modules/care/data/collections";
import { dailySettings } from "@/modules/daily/data/collections";
import { faithSettings } from "@/modules/faith/data/collections";
import { healthDoses, healthMedicines } from "@/modules/health/data/collections";
import { reminderSettings } from "../data/collections";
import { registerReminderTasks } from "../services/reminder-tasks";
import { rescheduleAll } from "../services/reschedule-all";

const SETTLE_MS = 1200;

/**
 * Keeps every reminder planned from anywhere in the app: on launch, whenever the app comes back
 * to the front, and shortly after the data behind a reminder changes. No screen needs to be open.
 */
export function useReminders(): void {
	const faith = useCollection(faithSettings);
	const daily = useCollection(dailySettings);
	const medicines = useCollection(healthMedicines);
	const doses = useCollection(healthDoses);
	const steps = useCollection(careSteps);
	const settings = useCollection(reminderSettings);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const plan = () => {
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			timer.current = null;
			rescheduleAll().catch((error: unknown) =>
				console.warn("[reminders] could not plan reminders", error),
			);
		}, SETTLE_MS);
	};

	useEffect(() => {
		if (Platform.OS === "web") return;
		registerReminderTasks().catch((error: unknown) =>
			console.warn("[reminders] background tasks unavailable", error),
		);
		const subscription = AppState.addEventListener("change", (state) => {
			if (state === "active") plan();
		});
		return () => {
			subscription.remove();
			if (timer.current) clearTimeout(timer.current);
		};
		// oxlint-disable-next-line react/exhaustive-deps -- set up once
	}, []);

	useEffect(() => {
		if (Platform.OS === "web") return;
		plan();
		// oxlint-disable-next-line react/exhaustive-deps -- re-plan when any source changes
	}, [faith.data, daily.data, medicines.data, doses.data, steps.data, settings.data]);
}
