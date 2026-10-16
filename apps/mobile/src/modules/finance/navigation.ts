import { router } from "expo-router";

/** Finance's own screens, pushed over Today. */
export const financeRoutes = {
	runway: () => router.push("/finance/runway"),
	log: () => router.push("/finance/log"),
	budget: () => router.push("/finance/budget"),
	income: () => router.push("/finance/income"),
	history: () => router.push("/finance/history"),
	insights: () => router.push("/finance/insights"),
	today: () => router.dismissTo("/"),
} as const;
