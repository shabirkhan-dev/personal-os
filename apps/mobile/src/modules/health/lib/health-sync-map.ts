import { dayKey } from "@/lib/day";
import { parseReading, type Reading, type ReadingKind, type ReadingSource } from "./health-model";

/**
 * Turns records from the phone's health store (Health Connect on Android, Apple Health on iPhone)
 * into Health readings. Every id is derived from the store's own record id (or the day, for
 * totals), so syncing the same data twice never makes a duplicate. Anything out of range is
 * dropped by `parseReading`.
 */

const PREFIX: Record<Exclude<ReadingSource, "manual">, string> = {
	"health-connect": "hc",
	healthkit: "hk",
};

function reading(
	source: Exclude<ReadingSource, "manual">,
	id: string,
	kind: ReadingKind,
	value: number,
	at: string,
	extra: { value2?: number; context?: Reading["context"] } = {},
): Reading | null {
	return parseReading({
		id: `${PREFIX[source]}:${id}`,
		kind,
		value: Math.round(value * 10) / 10,
		value2: extra.value2 === undefined ? null : Math.round(extra.value2),
		at,
		source,
		context: extra.context ?? null,
		note: "",
	});
}

/** Health Connect's relation-to-meal codes: 1 general, 2 fasting, 3 before, 4 after a meal. */
const HC_MEAL: Record<number, Reading["context"]> = { 2: "fasting", 4: "after-meal" };

type HcRecord = { metadata?: { id?: string }; time?: string; recordType?: string } & Record<
	string,
	unknown
>;

const num = (value: unknown) =>
	typeof value === "number" && Number.isFinite(value) ? value : null;
const field = (record: Record<string, unknown>, key: string, unit: string) => {
	const part = record[key];
	return typeof part === "object" && part !== null
		? num((part as Record<string, unknown>)[unit])
		: null;
};

/** One Health Connect instantaneous record → a reading, or null for a type Health doesn't keep. */
export function fromHealthConnect(record: HcRecord): Reading | null {
	const id = record.metadata?.id;
	const at = record.time;
	if (!id || typeof at !== "string") return null;
	switch (record.recordType) {
		case "RestingHeartRate": {
			const bpm = num(record.beatsPerMinute);
			return bpm === null ? null : reading("health-connect", id, "resting-hr", bpm, at);
		}
		case "HeartRateVariabilityRmssd": {
			const ms = num(record.heartRateVariabilityMillis);
			return ms === null ? null : reading("health-connect", id, "hrv", ms, at);
		}
		case "OxygenSaturation": {
			const percent = num(record.percentage);
			return percent === null ? null : reading("health-connect", id, "spo2", percent, at);
		}
		case "BloodPressure": {
			const systolic = field(record, "systolic", "inMillimetersOfMercury");
			const diastolic = field(record, "diastolic", "inMillimetersOfMercury");
			return systolic === null || diastolic === null
				? null
				: reading("health-connect", id, "bp", systolic, at, { value2: diastolic });
		}
		case "BloodGlucose": {
			const level = field(record, "level", "inMilligramsPerDeciliter");
			const meal = num(record.relationToMeal);
			return level === null
				? null
				: reading("health-connect", id, "blood-sugar", level, at, {
						context: (meal !== null ? HC_MEAL[meal] : undefined) ?? "random",
					});
		}
		case "BodyTemperature": {
			const celsius = field(record, "temperature", "inCelsius");
			return celsius === null ? null : reading("health-connect", id, "temperature", celsius, at);
		}
		case "Weight": {
			const kg = field(record, "weight", "inKilograms");
			return kg === null ? null : reading("health-connect", id, "weight", kg, at);
		}
		default:
			return null;
	}
}

/** One day's step total, one reading per day so a later sync updates it in place. */
export function stepsReading(
	source: Exclude<ReadingSource, "manual">,
	day: string,
	count: number,
): Reading | null {
	return reading(source, `steps:${day}`, "steps", Math.round(count), `${day}T12:00:00.000Z`);
}

export type Interval = { start: string; end: string };

/**
 * A night's sleep per morning: sessions (or asleep segments) are summed by the day they end on,
 * overlaps counted once. One reading per day.
 */
export function sleepReadings(
	source: Exclude<ReadingSource, "manual">,
	intervals: readonly Interval[],
): Reading[] {
	const byDay = new Map<string, { minutes: number; end: number }>();
	const sorted = [...intervals]
		.map((item) => ({ start: Date.parse(item.start), end: Date.parse(item.end) }))
		.filter((item) => Number.isFinite(item.start) && item.end > item.start)
		.sort((a, b) => a.start - b.start);
	let lastEnd = Number.NEGATIVE_INFINITY;
	for (const item of sorted) {
		const start = Math.max(item.start, lastEnd);
		if (item.end <= start) continue;
		lastEnd = item.end;
		const day = dayKey(new Date(item.end));
		const current = byDay.get(day) ?? { minutes: 0, end: 0 };
		byDay.set(day, {
			minutes: current.minutes + (item.end - start) / 60_000,
			end: Math.max(current.end, item.end),
		});
	}
	return [...byDay].flatMap(([day, night]) => {
		const out = reading(
			source,
			`sleep:${day}`,
			"sleep",
			Math.round(night.minutes),
			new Date(night.end).toISOString(),
		);
		return out ? [out] : [];
	});
}

export type Sample = { id: string; at: string; value: number };

/** Apple Health keeps the two blood pressure numbers as separate samples taken at the same time. */
export function pairBloodPressure(
	systolic: readonly Sample[],
	diastolic: readonly Sample[],
): Reading[] {
	return systolic.flatMap((top) => {
		const time = Date.parse(top.at);
		const bottom = diastolic.find((item) => Math.abs(Date.parse(item.at) - time) <= 60_000);
		const out = bottom
			? reading("healthkit", top.id, "bp", top.value, top.at, { value2: bottom.value })
			: null;
		return out ? [out] : [];
	});
}

/** One Apple Health quantity sample → a reading of `kind`. Oxygen comes as a 0–1 fraction. */
export function fromHealthKit(kind: ReadingKind, sample: Sample): Reading | null {
	const value = kind === "spo2" && sample.value <= 1 ? sample.value * 100 : sample.value;
	return reading("healthkit", sample.id, kind, value, sample.at);
}

/**
 * The readings worth writing: new ones and ones whose value changed. Re-saving identical
 * readings would only churn the sync.
 */
export function changed(incoming: readonly Reading[], existing: readonly Reading[]): Reading[] {
	const known = new Map(existing.map((item) => [item.id, item]));
	return incoming.filter((item) => {
		const before = known.get(item.id);
		return (
			!before ||
			before.value !== item.value ||
			before.value2 !== item.value2 ||
			before.at !== item.at
		);
	});
}
