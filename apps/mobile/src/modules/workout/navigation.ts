import { router } from "expo-router";

/** Training's own screens, pushed over Today. */
export const trainingRoutes = {
	plan: (template?: string) =>
		router.push({ pathname: "/training/plan", params: template ? { template } : {} }),
	live: () => router.push("/training/live"),
	boxing: () => router.push("/training/boxing"),
	session: (id: string) => router.push({ pathname: "/training/session/[id]", params: { id } }),
	skills: () => router.push("/training/skills"),
	week: () => router.push("/training/week"),
	insights: () => router.push("/training/insights"),
	today: () => router.dismissTo("/"),
} as const;
