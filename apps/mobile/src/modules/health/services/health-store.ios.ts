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
	pairBloodPressure,
	type Sample,
	sleepReadings,
	stepsReading,
} from "../lib/health-sync-map";
import type { HealthStore } from "./health-store";

export type { HealthStore, StoreStatus } from "./health-store";

/**
 * Apple Health on iPhone. Written against @kingstinct/react-native-healthkit's types and not yet
 * run on a device. Apple measures HRV as SDNN (Health Connect uses RMSSD), so the two phones'
 * HRV numbers aren't directly comparable.
 */

const SLEEP = "HKCategoryTypeIdentifierSleepAnalysis";
const STEPS = "HKQuantityTypeIdentifierStepCount";
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

export const healthStore: HealthStore = {
	name: "Apple Health",
	status: async () => (isHealthDataAvailable() ? "ready" : "unsupported"),
	connect: () =>
		requestAuthorization({
			toRead: [SLEEP, STEPS, SYSTOLIC, DIASTOLIC, ...QUANTITIES.map((item) => item.id)],
		}),
	read: async (from, to) => {
		const out: Reading[] = [];
		for (const item of QUANTITIES) {
			// oxlint-disable-next-line eslint/no-await-in-loop -- one type at a time
			for (const sample of await samples(item.id, item.unit, from, to)) {
				const reading = fromHealthKit(item.kind, sample);
				if (reading) out.push(reading);
			}
		}
		const [top, bottom] = await Promise.all([
			samples(SYSTOLIC, "mmHg", from, to),
			samples(DIASTOLIC, "mmHg", from, to),
		]);
		out.push(...pairBloodPressure(top, bottom));

		const nights = await queryCategorySamples(SLEEP, {
			limit: 0,
			filter: dates(addDays(from, -1), to),
		});
		out.push(
			...sleepReadings(
				"healthkit",
				nights
					.filter((sample) => ASLEEP.has(Number(sample.value)))
					.map((sample) => ({
						start: sample.startDate.toISOString(),
						end: sample.endDate.toISOString(),
					})),
			).filter((reading) => reading.at >= from.toISOString()),
		);

		for (let day = new Date(from); day <= to; day = addDays(day, 1)) {
			const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
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
	},
	openSettings: () => {
		void Linking.openURL("x-apple-health://").catch(() => Linking.openSettings());
	},
};
