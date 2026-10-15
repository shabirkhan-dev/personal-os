import { router } from "expo-router";

/** Faith's own screens, pushed over Today. */
export const faithRoutes = {
	qibla: () => router.push("/faith/qibla"),
	tasbih: () => router.push("/faith/tasbih"),
	zakat: () => router.push("/faith/zakat"),
	grow: () => router.push("/faith/grow"),
	recitation: () => router.push("/faith/recitation"),
	insights: () => router.push("/faith/insights"),
	flashcards: () => router.push("/faith/flashcards"),
	today: () => router.dismissTo("/"),
} as const;
