import { router } from "expo-router";
import type { ReadingKind } from "./lib/health-model";

/** Health's own screens, pushed over Today. */
export const healthRoutes = {
	vitals: (kind?: ReadingKind) =>
		router.push({ pathname: "/health/vitals", params: kind ? { kind } : {} }),
	medicines: () => router.push("/health/medicines"),
	checkups: () => router.push("/health/checkups"),
	labs: () => router.push("/health/labs"),
	symptoms: () => router.push("/health/symptoms"),
	profile: () => router.push("/health/profile"),
	insights: () => router.push("/health/insights"),
	today: () => router.dismissTo("/"),
} as const;
