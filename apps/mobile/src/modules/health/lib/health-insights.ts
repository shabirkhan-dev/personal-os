import { dayKey } from "@/lib/day";
import {
	average,
	bpBand,
	type Checkup,
	daysLeft,
	dueCheckups,
	type LabResult,
	labHistory,
	labStatus,
	type Medicine,
	type Reading,
	recent,
	shortSleepLink,
	SYMPTOM_LABELS,
	type Symptom,
} from "./health-model";

export type HealthNote =
	| { kind: "bp-high"; systolic: number; diastolic: number; label: string }
	| { kind: "sleep-symptom"; symptom: string; short: number; rest: number }
	| { kind: "overdue"; title: string; due: string }
	| { kind: "refill"; name: string; days: number }
	| { kind: "lab"; test: string; status: "low" | "high"; value: number; unit: string };

/** What Health Insights points out, most pressing first. */
export function healthNotes(input: {
	readings: readonly Reading[];
	symptoms: readonly Symptom[];
	checkups: readonly Checkup[];
	medicines: readonly Medicine[];
	labs: readonly LabResult[];
	now: Date;
}): HealthNote[] {
	const notes: HealthNote[] = [];
	const today = dayKey(input.now);

	const bp = recent(input.readings, "bp", input.now, 14);
	if (bp.length >= 3) {
		const systolic = Math.round(average(bp.map((reading) => reading.value)) ?? 0);
		const diastolic = Math.round(average(bp.map((reading) => reading.value2 ?? 0)) ?? 0);
		const band = bpBand(systolic, diastolic);
		if (band.tone === "high" || band.tone === "urgent" || band.label.startsWith("High")) {
			notes.push({ kind: "bp-high", systolic, diastolic, label: band.label });
		}
	}

	for (const item of dueCheckups(input.checkups, today)) {
		if (item.overdue) notes.push({ kind: "overdue", title: item.checkup.title, due: item.due });
	}

	for (const medicine of input.medicines) {
		const days = medicine.active ? daysLeft(medicine) : null;
		if (days !== null && days <= 5) notes.push({ kind: "refill", name: medicine.name, days });
	}

	for (const history of labHistory(input.labs).values()) {
		const last = history.at(-1);
		if (!last) continue;
		const status = labStatus(last);
		if (status === "low" || status === "high") {
			notes.push({ kind: "lab", test: last.test, status, value: last.value, unit: last.unit });
		}
	}

	// Sleep is stored on the morning after; a symptom that day counts against that night.
	const sleepByDay = new Map<string, number>();
	for (const reading of recent(input.readings, "sleep", input.now, 30)) {
		sleepByDay.set(dayKey(new Date(reading.at)), reading.value);
	}
	const kinds = new Set(input.symptoms.map((symptom) => symptom.kind));
	for (const kind of kinds) {
		const link = shortSleepLink(input.symptoms, sleepByDay, kind);
		if (link && link.short - link.rest >= 0.3) {
			notes.push({ kind: "sleep-symptom", symptom: SYMPTOM_LABELS[kind], ...link });
			break;
		}
	}
	return notes;
}
