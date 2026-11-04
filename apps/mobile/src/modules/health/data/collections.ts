import { defineCollection } from "@/lib/db/collection";
import {
	parseCheckup,
	parseDoseLog,
	parseHealthProfile,
	parseHealthRecord,
	parseLabResult,
	parseMedicine,
	parseReading,
	parseSymptom,
} from "../lib/health-model";

/** Health's slices of the record store. Names are part of the sync contract: never rename one. */
export const healthReadings = defineCollection("health-readings", parseReading);
export const healthCheckups = defineCollection("health-checkups", parseCheckup);
export const healthLabs = defineCollection("health-labs", parseLabResult);
export const healthMedicines = defineCollection("health-medicines", parseMedicine);
export const healthDoses = defineCollection("health-doses", parseDoseLog);
export const healthSymptoms = defineCollection("health-symptoms", parseSymptom);
export const healthProfile = defineCollection("health-profile", parseHealthProfile);
export const healthRecords = defineCollection("health-records", parseHealthRecord);
