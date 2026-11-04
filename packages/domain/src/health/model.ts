import { asArray, asBoolean, asNumber, asString, isRecord, oneOf } from "../parse";

/**
 * Health's documents: readings from you or your phone's health store, checkups, lab results,
 * medicines and the doses taken, symptoms, and one health profile. Each is parsed back
 * defensively, so a row from an older app version becomes a valid value instead of a crash.
 */

export const READING_KINDS = [
	"bp",
	"heart-rate",
	"resting-hr",
	"hrv",
	"spo2",
	"blood-sugar",
	"temperature",
	"weight",
	"steps",
	"sleep",
] as const;
export type ReadingKind = (typeof READING_KINDS)[number];

export const READING_SOURCES = ["manual", "health-connect", "healthkit"] as const;
export type ReadingSource = (typeof READING_SOURCES)[number];

export const SUGAR_CONTEXTS = ["fasting", "after-meal", "random"] as const;
export type SugarContext = (typeof SUGAR_CONTEXTS)[number];

/**
 * One measurement. `value` is in the kind's unit: mmHg (systolic; `value2` diastolic), bpm, ms,
 * %, mg/dL, °C, kg, steps, or minutes of sleep.
 */
export type Reading = {
	id: string;
	kind: ReadingKind;
	value: number;
	value2: number | null;
	/** ISO time it was measured. */
	at: string;
	source: ReadingSource;
	/** Blood sugar only. */
	context: SugarContext | null;
	note: string;
};

export const READING_UNITS: Record<ReadingKind, string> = {
	bp: "mmHg",
	"heart-rate": "bpm",
	"resting-hr": "bpm",
	hrv: "ms",
	spo2: "%",
	"blood-sugar": "mg/dL",
	temperature: "°C",
	weight: "kg",
	steps: "steps",
	sleep: "min",
};

export const READING_LABELS: Record<ReadingKind, string> = {
	bp: "Blood pressure",
	"heart-rate": "Heart rate",
	"resting-hr": "Resting heart rate",
	hrv: "HRV",
	spo2: "Blood oxygen",
	"blood-sugar": "Blood sugar",
	temperature: "Temperature",
	weight: "Weight",
	steps: "Steps",
	sleep: "Sleep",
};

/** What a believable value is per kind, so a typo or a bad sync never lands. */
export const READING_RANGES: Record<ReadingKind, readonly [number, number]> = {
	bp: [60, 260],
	"heart-rate": [25, 240],
	"resting-hr": [25, 150],
	hrv: [1, 300],
	spo2: [50, 100],
	"blood-sugar": [20, 600],
	temperature: [30, 45],
	weight: [20, 350],
	steps: [0, 150_000],
	sleep: [0, 1_440],
};

export const CHECKUP_KINDS = ["doctor", "dentist", "eyes", "lab", "vaccine", "other"] as const;
export type CheckupKind = (typeof CHECKUP_KINDS)[number];

export const CHECKUP_LABELS: Record<CheckupKind, string> = {
	doctor: "Doctor",
	dentist: "Dentist",
	eyes: "Eye test",
	lab: "Blood test",
	vaccine: "Vaccine",
	other: "Other",
};

/** A visit or a test: booked (`at` ahead), done, and how often it repeats. */
export type Checkup = {
	id: string;
	kind: CheckupKind;
	title: string;
	/** "YYYY-MM-DD" it is booked for or happened on. */
	on: string;
	done: boolean;
	/** Months until the next one; null when it doesn't repeat. */
	repeatMonths: number | null;
	note: string;
};

/** One lab value with the range your lab printed. */
export type LabResult = {
	id: string;
	test: string;
	value: number;
	unit: string;
	low: number | null;
	high: number | null;
	/** "YYYY-MM-DD". */
	on: string;
};

export type Medicine = {
	id: string;
	name: string;
	/** "500 mg", "1 tablet". */
	dose: string;
	/** Minutes after midnight for each daily dose. */
	times: number[];
	/** Pills (or doses) left; null when not tracked. */
	stock: number | null;
	active: boolean;
	startedOn: string;
	note: string;
};

/** One scheduled dose; id is `${medicineId}:${day}:${minutes}`. */
export type DoseLog = {
	id: string;
	medicineId: string;
	day: string;
	minutes: number;
	status: "taken" | "skipped";
	at: string;
};

export const SYMPTOMS = [
	"headache",
	"tired",
	"stress",
	"low-mood",
	"cold",
	"fever",
	"stomach",
	"back-pain",
	"joint-pain",
	"dizzy",
	"other",
] as const;
export type SymptomKind = (typeof SYMPTOMS)[number];

export const SYMPTOM_LABELS: Record<SymptomKind, string> = {
	headache: "Headache",
	tired: "Tired",
	stress: "Stressed",
	"low-mood": "Low mood",
	cold: "Cold or flu",
	fever: "Fever",
	stomach: "Stomach",
	"back-pain": "Back pain",
	"joint-pain": "Joint pain",
	dizzy: "Dizzy",
	other: "Other",
};

export type Symptom = {
	id: string;
	kind: SymptomKind;
	/** 1 mild … 3 bad. */
	severity: 1 | 2 | 3;
	/** "YYYY-MM-DD". */
	day: string;
	at: string;
	note: string;
};

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export type Contact = { name: string; phone: string };

/** The facts a doctor or a stranger helping in an emergency needs. One per person, id "profile". */
export type HealthProfile = {
	id: "profile";
	bloodGroup: BloodGroup;
	allergies: string[];
	conditions: string[];
	emergency: Contact | null;
	doctor: Contact | null;
	notes: string;
};

export const emptyProfile: HealthProfile = {
	id: "profile",
	bloodGroup: "unknown",
	allergies: [],
	conditions: [],
	emergency: null,
	doctor: null,
	notes: "",
};

// --- parsing ------------------------------------------------------------------------------------

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const text = (value: unknown, max = 500) => asString(value, "").trim().slice(0, max);
const day = (value: unknown) => (typeof value === "string" && DAY.test(value) ? value : null);
const iso = (value: unknown) =>
	typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
const finite = (value: unknown) => {
	const number = asNumber(value, Number.NaN);
	return Number.isFinite(number) ? number : null;
};
const id = (value: unknown) => {
	const out = text(value, 80);
	return out || null;
};

export function inRange(kind: ReadingKind, value: number): boolean {
	const [low, high] = READING_RANGES[kind];
	return value >= low && value <= high;
}

export function parseReading(raw: unknown): Reading | null {
	if (!isRecord(raw)) return null;
	const rid = id(raw.id);
	const kind = oneOf(raw.kind, READING_KINDS, "heart-rate");
	const value = finite(raw.value);
	const at = iso(raw.at);
	if (!rid || raw.kind !== kind || value === null || !at || !inRange(kind, value)) return null;
	const value2 = kind === "bp" ? finite(raw.value2) : null;
	if (kind === "bp" && (value2 === null || value2 < 30 || value2 > 160 || value2 >= value))
		return null;
	return {
		id: rid,
		kind,
		value,
		value2,
		at,
		source: oneOf(raw.source, READING_SOURCES, "manual"),
		context: kind === "blood-sugar" ? oneOf(raw.context, SUGAR_CONTEXTS, "random") : null,
		note: text(raw.note, 200),
	};
}

export function parseCheckup(raw: unknown): Checkup | null {
	if (!isRecord(raw)) return null;
	const cid = id(raw.id);
	const on = day(raw.on);
	if (!cid || !on) return null;
	const kind = oneOf(raw.kind, CHECKUP_KINDS, "other");
	const repeat = finite(raw.repeatMonths);
	return {
		id: cid,
		kind,
		title: text(raw.title, 120) || CHECKUP_LABELS[kind],
		on,
		done: asBoolean(raw.done, false),
		repeatMonths: repeat !== null && repeat >= 1 && repeat <= 120 ? Math.round(repeat) : null,
		note: text(raw.note),
	};
}

export function parseLabResult(raw: unknown): LabResult | null {
	if (!isRecord(raw)) return null;
	const lid = id(raw.id);
	const test = text(raw.test, 80);
	const value = finite(raw.value);
	const on = day(raw.on);
	if (!lid || !test || value === null || !on) return null;
	return {
		id: lid,
		test,
		value,
		unit: text(raw.unit, 20),
		low: finite(raw.low),
		high: finite(raw.high),
		on,
	};
}

export function parseMedicine(raw: unknown): Medicine | null {
	if (!isRecord(raw)) return null;
	const mid = id(raw.id);
	const name = text(raw.name, 80);
	if (!mid || !name) return null;
	const times = asArray(raw.times, (value) => {
		const minutes = finite(value);
		return minutes !== null && minutes >= 0 && minutes < 1_440 ? Math.round(minutes) : null;
	});
	const stock = finite(raw.stock);
	return {
		id: mid,
		name,
		dose: text(raw.dose, 40),
		times: [...new Set(times)].sort((a, b) => a - b),
		stock: stock !== null && stock >= 0 ? Math.round(stock) : null,
		active: asBoolean(raw.active, true),
		startedOn: day(raw.startedOn) ?? "1970-01-01",
		note: text(raw.note),
	};
}

export function parseDoseLog(raw: unknown): DoseLog | null {
	if (!isRecord(raw)) return null;
	const did = id(raw.id);
	const medicineId = id(raw.medicineId);
	const on = day(raw.day);
	const minutes = finite(raw.minutes);
	const at = iso(raw.at);
	if (!did || !medicineId || !on || minutes === null || !at) return null;
	return {
		id: did,
		medicineId,
		day: on,
		minutes,
		status: raw.status === "skipped" ? "skipped" : "taken",
		at,
	};
}

export function parseSymptom(raw: unknown): Symptom | null {
	if (!isRecord(raw)) return null;
	const sid = id(raw.id);
	const on = day(raw.day);
	const at = iso(raw.at);
	if (!sid || !on || !at) return null;
	const severity = finite(raw.severity);
	return {
		id: sid,
		kind: oneOf(raw.kind, SYMPTOMS, "other"),
		severity: severity === 3 ? 3 : severity === 2 ? 2 : 1,
		day: on,
		at,
		note: text(raw.note, 200),
	};
}

function parseContact(raw: unknown): Contact | null {
	if (!isRecord(raw)) return null;
	const contact = { name: text(raw.name, 80), phone: text(raw.phone, 30) };
	return contact.name || contact.phone ? contact : null;
}

export function parseHealthProfile(raw: unknown): HealthProfile | null {
	if (!isRecord(raw) || raw.id !== "profile") return null;
	const list = (value: unknown) =>
		asArray(value, (item) => {
			const entry = text(item, 80);
			return entry || null;
		}).slice(0, 30);
	return {
		id: "profile",
		bloodGroup: oneOf(raw.bloodGroup, BLOOD_GROUPS, "unknown"),
		allergies: list(raw.allergies),
		conditions: list(raw.conditions),
		emergency: parseContact(raw.emergency),
		doctor: parseContact(raw.doctor),
		notes: text(raw.notes, 1_000),
	};
}
