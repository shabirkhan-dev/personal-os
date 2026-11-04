import { useEffect } from "react";
import { useCollection } from "@/lib/db/collection";
import { healthMedicines } from "../data/collections";
import { scheduleMedicineReminders } from "../services/medicine-reminders";

/** Keeps the daily medicine reminders in step with the medicines, from anywhere in the app. */
export function useMedicineReminders(): void {
	const medicines = useCollection(healthMedicines);
	useEffect(() => {
		if (!medicines.data) return;
		scheduleMedicineReminders(medicines.data).catch((error: unknown) =>
			console.warn("[health] could not schedule medicine reminders", error),
		);
	}, [medicines.data]);
}
