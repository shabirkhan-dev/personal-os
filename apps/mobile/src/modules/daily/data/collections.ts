import { defineCollection } from "@/lib/db/collection";
import { parseLog, parsePlan, parseSettings, parseSleep } from "../lib/daily-model";

/** Daily life's slices of the record store. Names are part of the sync contract: never rename one. */
export const dailySettings = defineCollection("daily-settings", parseSettings);
export const dayLogs = defineCollection("daily-days", parseLog);
export const sleepLogs = defineCollection("daily-sleep", parseSleep);
export const dayPlans = defineCollection("daily-plans", parsePlan);
