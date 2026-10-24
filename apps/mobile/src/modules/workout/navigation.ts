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
	programs: () => router.push("/training/programs"),
	program: (id: string) => router.push({ pathname: "/training/program/[id]", params: { id } }),
	builder: (options: { id?: string; ai?: boolean } = {}) =>
		router.push({
			pathname: "/training/program-builder",
			params: {
				...(options.id ? { id: options.id } : {}),
				...(options.ai ? { ai: "1" } : {}),
			},
		}),
	exercises: () => router.push("/training/exercises"),
	calendar: () => router.push("/calendar"),
	exerciseEditor: (id?: string) =>
		router.push({ pathname: "/training/exercise-editor", params: id ? { id } : {} }),
	today: () => router.dismissTo("/"),
} as const;
