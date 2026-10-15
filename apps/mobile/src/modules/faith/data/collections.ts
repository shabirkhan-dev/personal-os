import { defineCollection } from "@/lib/db/collection";
import {
	parseCard,
	parseChallenge,
	parsePathProgress,
	parsePayment,
	parsePrayerLog,
	parseRecitation,
	parseResource,
	parseSettings,
	parseTasbihDay,
	parseZakat,
} from "../lib/faith-model";

/** Faith's slices of the record store. Names are part of the sync contract: never rename one. */
export const faithSettings = defineCollection("faith-settings", parseSettings);
export const prayerLogs = defineCollection("faith-prayer-logs", parsePrayerLog);
export const tasbihDays = defineCollection("faith-tasbih", parseTasbihDay);
export const recitations = defineCollection("faith-recitations", parseRecitation);
export const zakatProfiles = defineCollection("faith-zakat", parseZakat);
export const zakatPayments = defineCollection("faith-zakat-payments", parsePayment);
export const resources = defineCollection("faith-resources", parseResource);
export const challenges = defineCollection("faith-challenge", parseChallenge);
export const pathProgress = defineCollection("faith-paths", parsePathProgress);
export const faithCards = defineCollection("faith-cards", parseCard);
