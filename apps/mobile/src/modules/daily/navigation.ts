import { router } from "expo-router";

/** Daily life's own screens, pushed over Today. */
export const dailyRoutes = {
	brief: () => router.push("/daily/brief"),
	plan: () => router.push("/daily/plan"),
	close: () => router.push("/daily/close"),
	minimum: () => router.push("/daily/minimum"),
	sleep: () => router.push("/daily/sleep"),
	insights: () => router.push("/daily/insights"),
	today: () => router.dismissTo("/"),
} as const;
