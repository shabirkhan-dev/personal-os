import {
	isHealthDataAvailable,
	queryCategorySamples,
	queryQuantitySamples,
	queryStatisticsForQuantity,
	requestAuthorization,
} from "@kingstinct/react-native-healthkit";
import { Linking } from "react-native";
import { addDays, dayKey } from "@/lib/day";
import type { Reading, ReadingKind } from "../lib/health-model";
import {
	fromHealthKit,
	heartRateReading,
	pairBloodPressure,
	type Sample,
	sleepReadings,
	stepsReading,
} from "../lib/health-sync-map";
import type { HealthStore, StoreRead } from "./health-store";

export type { HealthStore, StoreRead, StoreStatus } from "./health-store";

/**
 * Apple Health on iPhone. Written against @kingstinct/react-native-healthkit's types and not yet
 * run on a device. Apple measures HRV as SDNN (Health Connect uses RMSSD), so the two phones'
 * HRV numbers aren't directly comparable.
 */

const SLEEP = "HKCategoryTypeIdentifierSleepAnalysis";
const STEPS = "HKQuantityTypeIdentifierStepCount";
const HEART = "HKQuantityTypeIdentifierHeartRate";
const SYSTOLIC = "HKQuantityTypeIdentifierBloodPressureSystolic";
const DIASTOLIC = "HKQuantityTypeIdentifierBloodPressureDiastolic";

const QUANTITIES = [
	{ id: "HKQuantityTypeIdentifierRestingHeartRate", unit: "count/min", kind: "resting-hr" },
	{ id: "HKQuantityTypeIdentifierHeartRateVariabilitySDNN", unit: "ms", kind: "hrv" },
	{ id: "HKQuantityTypeIdentifierOxygenSaturation", unit: "%", kind: "spo2" },
	{ id: "HKQuantityTypeIdentifierBloodGlucose", unit: "mg/dL", kind: "blood-sugar" },
	{ id: "HKQuantityTypeIdentifierBodyTemperature", unit: "degC", kind: "temperature" },
	{ id: "HKQuantityTypeIdentifierBodyMass", unit: "kg", kind: "weight" },
] as const satisfies readonly { id: string; unit: string; kind: ReadingKind }[];

/** Sleep analysis values that mean asleep: unspecified, core, deep and REM (not in bed or awake). */
const ASLEEP = new Set([1, 3, 4, 5]);

const dates = (from: Date, to: Date) => ({ date: { startDate: from, endDate: to } });

async function samples(id: string, unit: string, from: Date, to: Date): Promise<Sample[]> {
	const list = await queryQuantitySamples(id as (typeof QUANTITIES)[number]["id"], {
		limit: 0,
		unit: unit as never,
		filter: dates(from, to),
	});
	return list.map((sample) => ({
		id: sample.uuid,
		at: sample.startDate.toISOString(),
		value: sample.quantity,
	}));
}

/** Local midnights from `from`'s day to `to`'s day. */
function days(from: Date, to: Date): Date[] {
	const out: Date[] = [];
	for (
		let day = new Date(from.getFullYear(), from.getMonth(), from.getDate());
		day <= to;
		day = addDays(day, 1)
	) {
		out.push(day);
	}
	return out;
}

async function readQuantity(item: (typeof QUANTITIES)[number], from: Date, to: Date) {
	return (await samples(item.id, item.unit, from, to)).flatMap((sample) => {
		const reading = fromHealthKit(item.kind, sample);
		return reading ? [reading] : [];
	});
}

async function readBloodPressure(from: Date, to: Date) {
	const [top, bottom] = await Promise.all([
		samples(SYSTOLIC, "mmHg", from, to),
		samples(DIASTOLIC, "mmHg", from, to),
	]);
	return pairBloodPressure(top, bottom);
}

async function readSleep(from: Date, to: Date) {
	const nights = await queryCategorySamples(SLEEP, {
		limit: 0,
		filter: dates(addDays(from, -1), to),
	});
	return sleepReadings(
		"healthkit",
		nights
			.filter((sample) => ASLEEP.has(Number(sample.value)))
			.map((sample) => ({
				start: sample.startDate.toISOString(),
				end: sample.endDate.toISOString(),
			})),
	).filter((reading) => reading.at >= from.toISOString());
}

async function readSteps(from: Date, to: Date) {
	const out: Reading[] = [];
	for (const start of days(from, to)) {
		// oxlint-disable-next-line eslint/no-await-in-loop -- one day at a time
		const total = await queryStatisticsForQuantity(STEPS, ["cumulativeSum"], {
			filter: dates(start, addDays(start, 1)),
			unit: "count",
		});
		const count = total.sumQuantity?.quantity ?? 0;
		const reading = count > 0 ? stepsReading("healthkit", dayKey(start), count) : null;
		if (reading) out.push(reading);
	}
	return out;
}

async function readHeartRate(from: Date, to: Date) {
	const out: Reading[] = [];
	for (const start of days(from, to)) {
		// oxlint-disable-next-line eslint/no-await-in-loop -- one day at a time
		const day = await queryStatisticsForQuantity(HEART, ["discreteAverage"], {
			filter: dates(start, addDays(start, 1)),
			unit: "count/min",
		});
		const bpm = day.averageQuantity?.quantity ?? 0;
		const reading = bpm > 0 ? heartRateReading("healthkit", dayKey(start), bpm) : null;
		if (reading) out.push(reading);
	}
	return out;
}

export const healthStore: HealthStore = {
	name: "Apple Health",
	status: async () => (isHealthDataAvailable() ? "ready" : "unsupported"),
	connect: () =>
		requestAuthorization({
			toRead: [SLEEP, STEPS, HEART, SYSTOLIC, DIASTOLIC, ...QUANTITIES.map((item) => item.id)],
		}),
	read: async (from, to) => {
		// Apple Health never says what was refused (a refused type just reads empty), so every
		// type counts as allowed.
		const jobs: [string, () => Promise<Reading[]>][] = [
			...QUANTITIES.map((item): [string, () => Promise<Reading[]>] => [
				item.kind,
				() => readQuantity(item, from, to),
			]),
			["bp", () => readBloodPressure(from, to)],
			["sleep", () => readSleep(from, to)],
			["steps", () => readSteps(from, to)],
			["heart-rate", () => readHeartRate(from, to)],
		];
		const result: StoreRead = { readings: [], allowed: jobs.length, failed: [] };
		for (const [type, job] of jobs) {
			try {
				// oxlint-disable-next-line eslint/no-await-in-loop -- one type at a time
				result.readings.push(...(await job()));
			} catch (error) {
				console.warn(`[health] could not read ${type} from Apple Health`, error);
				result.failed.push(type);
			}
		}
		return result;
	},
	openSettings: () => {
		void Linking.openURL("x-apple-health://").catch(() => Linking.openSettings());
	},
};
