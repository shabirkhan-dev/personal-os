import { router } from "expo-router";
import type { Routine } from "./lib/care-model";

/** Care's own screens, pushed over Today. */
export const careRoutes = {
	routine: (routine: Routine) => router.push({ pathname: "/care/routine", params: { routine } }),
	/** Write or change a step; `id` edits one, `routine` says where a new one goes. */
	step: (routine: Routine, id?: string) =>
		router.push({ pathname: "/care/step", params: id ? { routine, id } : { routine } }),
	templates: () => router.push("/care/templates"),
	design: () => router.push("/care/design"),
	shelf: () => router.push("/care/shelf"),
	hair: () => router.push("/care/hair"),
	body: () => router.push("/care/body"),
	checkIn: () => router.push("/care/check-in"),
	insights: () => router.push("/care/insights"),
	today: () => router.dismissTo("/"),
} as const;
