import { Linking } from "react-native";
import {
	aggregateRecord,
	getGrantedPermissions,
	getSdkStatus,
	initialize,
	openHealthConnectSettings,
	readRecords,
	requestPermission,
	SdkAvailabilityStatus,
} from "react-native-health-connect";
import { addDays, dayKey } from "@/lib/day";
import type { Reading } from "../lib/health-model";
import {
	fromHealthConnect,
	heartRateReading,
	sleepReadings,
	stepsReading,
} from "../lib/health-sync-map";
import type { HealthStore, StoreRead } from "./health-store";

export type { HealthStore, StoreRead, StoreStatus } from "./health-store";

/** The Health Connect record types Health reads; each needs its manifest permission. */
const TYPES = [
	"Steps",
	"SleepSession",
	"HeartRate",
	"RestingHeartRate",
	"HeartRateVariabilityRmssd",
	"OxygenSaturation",
	"BloodPressure",
	"BloodGlucose",
	"BodyTemperature",
	"Weight",
] as const;

/** Types read record by record; steps, sleep and all-day heart rate are summed per day instead. */
const INSTANT = [
	"RestingHeartRate",
	"HeartRateVariabilityRmssd",
	"OxygenSaturation",
	"BloodPressure",
	"BloodGlucose",
	"BodyTemperature",
	"Weight",
] as const;

let ready = false;
async function ensure(): Promise<boolean> {
	if (!ready) ready = await initialize();
	return ready;
}

async function granted(): Promise<Set<string>> {
	const list = await getGrantedPermissions();
	return new Set(list.filter((item) => item.accessType === "read").map((item) => item.recordType));
}

const between = (from: Date, to: Date) => ({
	operator: "between" as const,
	startTime: from.toISOString(),
	endTime: to.toISOString(),
});

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

/** Every page of one record type in the range. */
async function readAll(type: (typeof INSTANT)[number] | "SleepSession", from: Date, to: Date) {
	const records: unknown[] = [];
	let pageToken: string | undefined;
	do {
		// oxlint-disable-next-line eslint/no-await-in-loop -- pages come one after another
		const page = await readRecords(type, { timeRangeFilter: between(from, to), pageToken });
		records.push(...page.records);
		pageToken = page.pageToken || undefined;
	} while (pageToken);
	return records;
}

async function readInstant(type: (typeof INSTANT)[number], from: Date, to: Date) {
	return (await readAll(type, from, to)).flatMap((record) => {
		const reading = fromHealthConnect(type, record as Parameters<typeof fromHealthConnect>[1]);
		return reading ? [reading] : [];
	});
}

async function readSleep(from: Date, to: Date) {
	// Nights that end in the range: start the search a day early.
	const records = (await readAll("SleepSession", addDays(from, -1), to)) as {
		startTime: string;
		endTime: string;
	}[];
	return sleepReadings(
		"health-connect",
		records.map((record) => ({ start: record.startTime, end: record.endTime })),
	).filter((reading) => reading.at >= from.toISOString());
}

async function readSteps(from: Date, to: Date) {
	const out: Reading[] = [];
	for (const start of days(from, to)) {
		// oxlint-disable-next-line eslint/no-await-in-loop -- one day at a time
		const total = await aggregateRecord({
			recordType: "Steps",
			timeRangeFilter: between(start, addDays(start, 1)),
		});
		const reading =
			total.COUNT_TOTAL > 0
				? stepsReading("health-connect", dayKey(start), total.COUNT_TOTAL)
				: null;
		if (reading) out.push(reading);
	}
	return out;
}

async function readHeartRate(from: Date, to: Date) {
	const out: Reading[] = [];
	for (const start of days(from, to)) {
		// oxlint-disable-next-line eslint/no-await-in-loop -- one day at a time
		const day = await aggregateRecord({
			recordType: "HeartRate",
			timeRangeFilter: between(start, addDays(start, 1)),
		});
		const reading =
			day.BPM_AVG > 0 ? heartRateReading("health-connect", dayKey(start), day.BPM_AVG) : null;
		if (reading) out.push(reading);
	}
	return out;
}

export const healthStore: HealthStore = {
	name: "Health Connect",
	status: async () => {
		const status = await getSdkStatus();
		if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return "ready";
		if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED)
			return "needs-app";
		return "unsupported";
	},
	connect: async () => {
		if (!(await ensure())) return false;
		const allowed = await requestPermission(
			TYPES.map((recordType) => ({ accessType: "read" as const, recordType })),
		);
		return allowed.length > 0;
	},
	read: async (from, to) => {
		const result: StoreRead = { readings: [], allowed: 0, failed: [] };
		if (!(await ensure())) return result;
		const allowed = await granted();
		const jobs: [string, () => Promise<Reading[]>][] = [
			...INSTANT.map((type): [string, () => Promise<Reading[]>] => [
				type,
				() => readInstant(type, from, to),
			]),
			["SleepSession", () => readSleep(from, to)],
			["Steps", () => readSteps(from, to)],
			["HeartRate", () => readHeartRate(from, to)],
		];
		for (const [type, job] of jobs) {
			if (!allowed.has(type)) continue;
			result.allowed += 1;
			try {
				// oxlint-disable-next-line eslint/no-await-in-loop -- one type at a time, as Health Connect prefers
				result.readings.push(...(await job()));
			} catch (error) {
				console.warn(`[health] could not read ${type} from Health Connect`, error);
				result.failed.push(type);
			}
		}
		return result;
	},
	openSettings: () => {
		try {
			openHealthConnectSettings();
		} catch (error) {
			// Health Connect isn't installed on older Android: open its Play Store page instead.
			console.warn("[health] could not open Health Connect", error);
			void Linking.openURL("market://details?id=com.google.android.apps.healthdata");
		}
	},
};
