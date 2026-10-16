import { router } from "expo-router";
import type { Routine } from "./lib/care-model";

/** Care's own screens, pushed over Today. */
export const careRoutes = {
	routine: (routine: Routine) => router.push({ pathname: "/care/routine", params: { routine } }),
	shelf: () => router.push("/care/shelf"),
	hair: () => router.push("/care/hair"),
	body: () => router.push("/care/body"),
	checkIn: () => router.push("/care/check-in"),
	insights: () => router.push("/care/insights"),
	today: () => router.dismissTo("/"),
} as const;
