import { router } from "expo-router";

/** Career's own screens, pushed over Today. */
export const careerRoutes = {
	applications: () => router.push("/career/applications"),
	application: (id: string) =>
		router.push({ pathname: "/career/application/[id]", params: { id } }),
	prep: (id?: string) =>
		id
			? router.push({ pathname: "/career/prep/[id]", params: { id } })
			: router.push("/career/prep"),
	flashcards: (deck: string) =>
		router.push({ pathname: "/career/flashcards/[deck]", params: { deck } }),
	skill: () => router.push("/career/skill"),
	skillPath: () => router.push("/career/skill-path"),
	today: () => router.dismissTo("/"),
} as const;
