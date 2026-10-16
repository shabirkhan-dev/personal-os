import { defineCollection } from "@/lib/db/collection";
import {
	parseCheckIn,
	parseDay,
	parseHabit,
	parseProduct,
	parseSettings,
	parseStep,
} from "../lib/care-model";

/** Care's slices of the record store. Names are part of the sync contract: never rename one. */
export const careSettings = defineCollection("care-settings", parseSettings);
export const careSteps = defineCollection("care-steps", parseStep);
export const careProducts = defineCollection("care-products", parseProduct);
export const careHabits = defineCollection("care-habits", parseHabit);
export const careDays = defineCollection("care-days", parseDay);
export const careCheckIns = defineCollection("care-checkins", parseCheckIn);
