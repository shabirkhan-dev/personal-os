import { removeItem, saveItem } from "@/lib/db/collection";
import { dayKey, newId } from "@/lib/day";
import {
	type Checkup,
	type DoseLog,
	doseId,
	type HealthProfile,
	type LabResult,
	type Medicine,
	type Reading,
	type ReadingKind,
	type SugarContext,
	type Symptom,
} from "../lib/health-model";
import {
	healthCheckups,
	healthDoses,
	healthLabs,
	healthMedicines,
	healthProfile,
	healthReadings,
	healthSymptoms,
} from "./collections";

/** Every Health write. Each saves to the record store, which refreshes the screens and syncs. */

export function logReading(input: {
	kind: ReadingKind;
	value: number;
	value2?: number | null;
	context?: SugarContext | null;
	at?: Date;
	note?: string;
}): Promise<Reading> {
	const reading: Reading = {
		id: newId(),
		kind: input.kind,
		value: input.value,
		value2: input.kind === "bp" ? (input.value2 ?? null) : null,
		at: (input.at ?? new Date()).toISOString(),
		source: "manual",
		context: input.kind === "blood-sugar" ? (input.context ?? "random") : null,
		note: input.note ?? "",
	};
	return saveItem(healthReadings, reading).then(() => reading);
}

export const removeReading = (id: string) => removeItem(healthReadings, id);

export const saveCheckup = (checkup: Checkup) => saveItem(healthCheckups, checkup);
export const removeCheckup = (id: string) => removeItem(healthCheckups, id);
export const newCheckupId = () => newId();

export const saveLab = (result: LabResult) => saveItem(healthLabs, result);
export const removeLab = (id: string) => removeItem(healthLabs, id);
export const newLabId = () => newId();

export const saveMedicine = (medicine: Medicine) => saveItem(healthMedicines, medicine);
export const removeMedicine = (id: string) => removeItem(healthMedicines, id);
export const newMedicineId = () => newId();

/** Marks one dose taken or skipped; taking one uses a pill from the stock when it is tracked. */
export async function markDose(
	medicine: Medicine,
	day: string,
	minutes: number,
	status: DoseLog["status"],
): Promise<void> {
	const log: DoseLog = {
		id: doseId(medicine.id, day, minutes),
		medicineId: medicine.id,
		day,
		minutes,
		status,
		at: new Date().toISOString(),
	};
	await saveItem(healthDoses, log);
	if (status === "taken" && medicine.stock !== null && medicine.stock > 0) {
		await saveItem(healthMedicines, { ...medicine, stock: medicine.stock - 1 });
	}
}

/** Undoes a dose mark, putting the pill back when one was taken. */
export async function unmarkDose(medicine: Medicine, log: DoseLog): Promise<void> {
	await removeItem(healthDoses, log.id);
	if (log.status === "taken" && medicine.stock !== null) {
		await saveItem(healthMedicines, { ...medicine, stock: medicine.stock + 1 });
	}
}

export function logSymptom(kind: Symptom["kind"], severity: Symptom["severity"], note = "") {
	const now = new Date();
	const symptom: Symptom = {
		id: newId(),
		kind,
		severity,
		day: dayKey(now),
		at: now.toISOString(),
		note,
	};
	return saveItem(healthSymptoms, symptom);
}

export const removeSymptom = (id: string) => removeItem(healthSymptoms, id);

export const saveProfile = (profile: HealthProfile) => saveItem(healthProfile, profile);
