import type { Href } from "expo-router";
import { type ModuleId, moduleOptions } from "@/modules/onboarding/lib/options";

/** Each module's Insights screen. Career has none yet. */
export const INSIGHTS_ROUTES: Partial<Record<ModuleId, Href & string>> = {
	"daily-life": "/daily/insights",
	workout: "/training/insights",
	finance: "/finance/insights",
	skincare: "/care/insights",
	food: "/food/insights",
	fashion: "/fashion/insights",
	faith: "/faith/insights",
	wishlist: "/wishlist/insights",
};

export type InsightsArea = { id: ModuleId; label: string; route: Href & string };

/** The person's modules that have Insights, in the app's module order. */
export function insightsAreas(modules: readonly ModuleId[]): InsightsArea[] {
	return moduleOptions.flatMap((option) => {
		const route = INSIGHTS_ROUTES[option.id];
		return route && modules.includes(option.id)
			? [{ id: option.id, label: option.label, route }]
			: [];
	});
}

/** Which module's Insights a pathname such as "/food/insights" is, if any. */
export function insightsAreaFor(pathname: string): ModuleId | null {
	const match = Object.entries(INSIGHTS_ROUTES).find(([, route]) => route === pathname);
	return match ? (match[0] as ModuleId) : null;
}

/**
 * Where the Insights tab goes from a screen that has none of its own (Profile, Career, Calendar):
 * the last Insights opened while it is still on, else the first module that has one.
 */
export function insightsTarget(
	modules: readonly ModuleId[],
	last: ModuleId | null,
): (Href & string) | null {
	const areas = insightsAreas(modules);
	return (areas.find((area) => area.id === last) ?? areas[0])?.route ?? null;
}
