import { addDays, dayKey } from "../dates";
import type {
	Checkup,
	DoseLog,
	LabResult,
	Medicine,
	Reading,
	ReadingKind,
	SugarContext,
	Symptom,
} from "./model";

// --- categories ---------------------------------------------------------------------------------

export type Band = { label: string; tone: "good" | "watch" | "high" | "urgent" };

/** Blood pressure by the AHA bands, from the higher of the two readings' bands. */
export function bpBand(systolic: number, diastolic: number): Band {
	if (systolic > 180 || diastolic > 120)
		return { label: "Very high · get help now", tone: "urgent" };
	if (systolic >= 140 || diastolic >= 90) return { label: "High · stage 2", tone: "high" };
	if (systolic >= 130 || diastolic >= 80) return { label: "High · stage 1", tone: "watch" };
	if (systolic >= 120) return { label: "Elevated", tone: "watch" };
	if (systolic < 90 || diastolic < 60) return { label: "Low", tone: "watch" };
	return { label: "Normal", tone: "good" };
}

/** Blood sugar in mg/dL by the ADA cut-offs; after a meal uses the two-hour limits. */
export function sugarBand(value: number, context: SugarContext): Band {
	if (value < 70) return { label: "Low", tone: "urgent" };
	if (context === "fasting") {
		if (value >= 126) return { label: "High", tone: "high" };
		if (value >= 100) return { label: "A little high", tone: "watch" };
		return { label: "Normal", tone: "good" };
	}
	if (value >= 200) return { label: "High", tone: "high" };
	if (value >= 140) return { label: "A little high", tone: "watch" };
	return { label: "Normal", tone: "good" };
}

export function spo2Band(value: number): Band {
	if (value < 90) return { label: "Low · get help", tone: "urgent" };
	if (value < 95) return { label: "A little low", tone: "watch" };
	return { label: "Normal", tone: "good" };
}

export function temperatureBand(celsius: number): Band {
	if (celsius >= 39.5) return { label: "High fever", tone: "high" };
	if (celsius >= 38) return { label: "Fever", tone: "watch" };
	if (celsius < 35.5) return { label: "Low", tone: "watch" };
	return { label: "Normal", tone: "good" };
}

/** The band for any reading that has one; null for steps, weight, sleep and heart rate. */
export function readingBand(reading: Reading): Band | null {
	switch (reading.kind) {
		case "bp":
			return reading.value2 === null ? null : bpBand(reading.value, reading.value2);
		case "blood-sugar":
			return sugarBand(reading.value, reading.context ?? "random");
		case "spo2":
			return spo2Band(reading.value);
		case "temperature":
			return temperatureBand(reading.value);
		default:
			return null;
	}
}

// --- readings -----------------------------------------------------------------------------------

const newestFirst = (a: Reading, b: Reading) => Date.parse(b.at) - Date.parse(a.at);

export function latest(readings: readonly Reading[], kind: ReadingKind): Reading | null {
	return readings.filter((reading) => reading.kind === kind).sort(newestFirst)[0] ?? null;
}

/** Readings of a kind in the `days` before `now` (today included), newest first. */
export function recent(
	readings: readonly Reading[],
	kind: ReadingKind,
	now: Date,
	days: number,
): Reading[] {
	const from = dayKey(addDays(now, -(days - 1)));
	return readings
		.filter((reading) => reading.kind === kind && dayKey(new Date(reading.at)) >= from)
		.sort(newestFirst);
}

export function average(values: readonly number[]): number | null {
	return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

/** Your normal for a kind: the average over the 30 days before today. */
export function baseline(
	readings: readonly Reading[],
	kind: ReadingKind,
	now: Date,
): number | null {
	const today = dayKey(now);
	const values = recent(readings, kind, now, 31)
		.filter((reading) => dayKey(new Date(reading.at)) < today)
		.map((reading) => reading.value);
	return values.length >= 3 ? average(values) : null;
}

/** The newest value of a kind for one day, e.g. today's steps or last night's sleep. */
export function onDay(
	readings: readonly Reading[],
	kind: ReadingKind,
	day: string,
): Reading | null {
	return (
		readings
			.filter((reading) => reading.kind === kind && dayKey(new Date(reading.at)) === day)
			.sort(newestFirst)[0] ?? null
	);
}

// --- readiness ----------------------------------------------------------------------------------

export type Readiness = {
	/** 0–100. */
	score: number;
	label: "Ready" | "Steady" | "Take it easy";
	/** One plain line on what moved it most. */
	reason: string;
};

/**
 * How ready the body looks today, from last night's sleep and this morning's resting heart rate
 * and HRV against your own 30-day normal. Null until there is at least one of them.
 */
export function readiness(input: {
	sleepMinutes: number | null;
	restingHr: number | null;
	hrv: number | null;
	baselineHr: number | null;
	baselineHrv: number | null;
}): Readiness | null {
	const parts: { score: number; weight: number; note: string }[] = [];
	if (input.sleepMinutes !== null) {
		const hours = input.sleepMinutes / 60;
		const score = Math.max(0, Math.min(100, ((hours - 4) / 4) * 100));
		const shown = `${Math.floor(hours)}h${input.sleepMinutes % 60 ? ` ${input.sleepMinutes % 60}m` : ""}`;
		parts.push({
			score,
			weight: 0.5,
			note: hours >= 7 ? `slept ${shown}` : `only ${shown} of sleep`,
		});
	}
	if (input.restingHr !== null && input.baselineHr !== null) {
		const diff = input.restingHr - input.baselineHr;
		const score = Math.max(0, Math.min(100, 80 - diff * 8));
		parts.push({
			score,
			weight: 0.25,
			note:
				Math.abs(diff) < 2
					? "resting heart rate normal"
					: `resting heart rate ${diff > 0 ? "up" : "down"} ${Math.round(Math.abs(diff))}`,
		});
	}
	if (input.hrv !== null && input.baselineHrv !== null && input.baselineHrv > 0) {
		const change = (input.hrv - input.baselineHrv) / input.baselineHrv;
		const score = Math.max(0, Math.min(100, 75 + change * 150));
		parts.push({
			score,
			weight: 0.25,
			note:
				Math.abs(change) < 0.08
					? "HRV normal"
					: `HRV ${change > 0 ? "up" : "down"} ${Math.round(Math.abs(change) * 100)}%`,
		});
	}
	if (parts.length === 0) return null;
	const weight = parts.reduce((sum, part) => sum + part.weight, 0);
	const score = Math.round(parts.reduce((sum, part) => sum + part.score * part.weight, 0) / weight);
	const label = score >= 75 ? "Ready" : score >= 50 ? "Steady" : "Take it easy";
	const worst = [...parts].sort((a, b) => a.score - b.score)[0];
	const reason = [worst?.note, ...parts.filter((part) => part !== worst).map((part) => part.note)]
		.filter(Boolean)
		.join(", ");
	return { score, label, reason: `${reason.charAt(0).toUpperCase()}${reason.slice(1)}.` };
}

// --- checkups -----------------------------------------------------------------------------------

function addMonths(day: string, months: number): string {
	const [year, month, date] = day.split("-").map(Number) as [number, number, number];
	const next = new Date(year, month - 1 + months, 1);
	const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
	next.setDate(Math.min(date, last));
	return dayKey(next);
}

export type DueCheckup = { checkup: Checkup; due: string; overdue: boolean; booked: boolean };

/**
 * What's coming up: booked visits not yet done, and the next one of each repeating checkup after
 * its latest done visit. Soonest first.
 */
export function dueCheckups(checkups: readonly Checkup[], today: string): DueCheckup[] {
	const due: DueCheckup[] = checkups
		.filter((checkup) => !checkup.done)
		.map((checkup) => ({ checkup, due: checkup.on, overdue: checkup.on < today, booked: true }));
	const latestDone = new Map<string, Checkup>();
	for (const checkup of checkups) {
		if (!checkup.done || checkup.repeatMonths === null) continue;
		const key = `${checkup.kind}:${checkup.title.toLowerCase()}`;
		const current = latestDone.get(key);
		if (!current || checkup.on > current.on) latestDone.set(key, checkup);
	}
	for (const [key, checkup] of latestDone) {
		const next = addMonths(checkup.on, checkup.repeatMonths ?? 12);
		const alreadyBooked = due.some(
			(item) => `${item.checkup.kind}:${item.checkup.title.toLowerCase()}` === key,
		);
		if (!alreadyBooked) due.push({ checkup, due: next, overdue: next < today, booked: false });
	}
	return due.sort((a, b) => a.due.localeCompare(b.due));
}

// --- medicines ----------------------------------------------------------------------------------

export const doseId = (medicineId: string, day: string, minutes: number) =>
	`${medicineId}:${day}:${minutes}`;

export type DoseState = "taken" | "skipped" | "due" | "missed" | "later";

export type TodayDose = { medicine: Medicine; minutes: number; state: DoseState };

/** A dose is due from its time until two hours after; after that, untaken means missed. */
const GRACE_MINUTES = 120;

export function dosesOn(
	medicines: readonly Medicine[],
	logs: readonly DoseLog[],
	day: string,
	minuteNow: number,
	today: string,
): TodayDose[] {
	const byId = new Map(logs.map((log) => [log.id, log]));
	return medicines
		.filter((medicine) => medicine.active && medicine.startedOn <= day)
		.flatMap((medicine) =>
			medicine.times.map((minutes): TodayDose => {
				const log = byId.get(doseId(medicine.id, day, minutes));
				if (log) return { medicine, minutes, state: log.status };
				if (day < today) return { medicine, minutes, state: "missed" };
				if (day > today || minutes > minuteNow) return { medicine, minutes, state: "later" };
				return {
					medicine,
					minutes,
					state: minuteNow - minutes > GRACE_MINUTES ? "missed" : "due",
				};
			}),
		)
		.sort((a, b) => a.minutes - b.minutes || a.medicine.name.localeCompare(b.medicine.name));
}

/** Share of scheduled doses taken over the last `days` days before today; null with none due. */
export function adherence(
	medicines: readonly Medicine[],
	logs: readonly DoseLog[],
	now: Date,
	days: number,
): number | null {
	const today = dayKey(now);
	let due = 0;
	let taken = 0;
	for (let back = 1; back <= days; back += 1) {
		const day = dayKey(addDays(now, -back));
		for (const dose of dosesOn(medicines, logs, day, 0, today)) {
			due += 1;
			if (dose.state === "taken") taken += 1;
		}
	}
	return due ? taken / due : null;
}

/** Days until a medicine runs out at its daily doses; null when stock isn't tracked. */
export function daysLeft(medicine: Medicine): number | null {
	if (medicine.stock === null || medicine.times.length === 0) return null;
	return Math.floor(medicine.stock / medicine.times.length);
}

// --- labs and symptoms --------------------------------------------------------------------------

export function labStatus(result: LabResult): "low" | "high" | "normal" | "unknown" {
	if (result.low === null && result.high === null) return "unknown";
	if (result.low !== null && result.value < result.low) return "low";
	if (result.high !== null && result.value > result.high) return "high";
	return "normal";
}

/** Each test's results, oldest first, so a trend reads left to right. */
export function labHistory(results: readonly LabResult[]): Map<string, LabResult[]> {
	const out = new Map<string, LabResult[]>();
	for (const result of [...results].sort((a, b) => a.on.localeCompare(b.on))) {
		const key = result.test.trim().toLowerCase();
		out.set(key, [...(out.get(key) ?? []), result]);
	}
	return out;
}

/**
 * Whether a symptom shows up more after short nights: the share of nights under six hours that
 * were followed by it, against the share of longer nights. Needs three of each to say anything.
 */
export function shortSleepLink(
	symptoms: readonly Symptom[],
	sleepByDay: ReadonlyMap<string, number>,
	kind: Symptom["kind"],
): { short: number; rest: number } | null {
	const days = new Set(symptoms.filter((symptom) => symptom.kind === kind).map((s) => s.day));
	let shortNights = 0;
	let shortWith = 0;
	let restNights = 0;
	let restWith = 0;
	for (const [day, minutes] of sleepByDay) {
		if (minutes < 360) {
			shortNights += 1;
			if (days.has(day)) shortWith += 1;
		} else {
			restNights += 1;
			if (days.has(day)) restWith += 1;
		}
	}
	if (shortNights < 3 || restNights < 3) return null;
	return { short: shortWith / shortNights, rest: restWith / restNights };
}
