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
import { fromHealthConnect, sleepReadings, stepsReading } from "../lib/health-sync-map";
import type { HealthStore } from "./health-store";

export type { HealthStore, StoreStatus } from "./health-store";

/** The Health Connect record types Health reads; each needs its manifest permission. */
const TYPES = [
	"Steps",
	"SleepSession",
	"RestingHeartRate",
	"HeartRateVariabilityRmssd",
	"OxygenSaturation",
	"BloodPressure",
	"BloodGlucose",
	"BodyTemperature",
	"Weight",
] as const;

const INSTANT = TYPES.filter((type) => type !== "Steps" && type !== "SleepSession");

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
		if (!(await ensure())) return [];
		const allowed = await granted();
		const out: Reading[] = [];
		for (const type of INSTANT) {
			if (!allowed.has(type)) continue;
			// oxlint-disable-next-line eslint/no-await-in-loop -- one type at a time, as Health Connect prefers
			const { records } = await readRecords(type, { timeRangeFilter: between(from, to) });
			for (const record of records) {
				const reading = fromHealthConnect(
					record as unknown as Parameters<typeof fromHealthConnect>[0],
				);
				if (reading) out.push(reading);
			}
		}
		if (allowed.has("SleepSession")) {
			// Nights that end in the range: start the search a day early.
			const { records } = await readRecords("SleepSession", {
				timeRangeFilter: between(addDays(from, -1), to),
			});
			out.push(
				...sleepReadings(
					"health-connect",
					records.map((record) => ({ start: record.startTime, end: record.endTime })),
				).filter((reading) => reading.at >= from.toISOString()),
			);
		}
		if (allowed.has("Steps")) {
			for (let day = new Date(from); day <= to; day = addDays(day, 1)) {
				const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
				const end = addDays(start, 1);
				// oxlint-disable-next-line eslint/no-await-in-loop -- one day at a time
				const total = await aggregateRecord({
					recordType: "Steps",
					timeRangeFilter: between(start, end),
				});
				const reading =
					total.COUNT_TOTAL > 0
						? stepsReading("health-connect", dayKey(start), total.COUNT_TOTAL)
						: null;
				if (reading) out.push(reading);
			}
		}
		return out;
	},
	openSettings: () => {
		try {
			openHealthConnectSettings();
		} catch {
			// Health Connect isn't installed on older Android: open its Play Store page instead.
			void Linking.openURL("market://details?id=com.google.android.apps.healthdata");
		}
	},
};
