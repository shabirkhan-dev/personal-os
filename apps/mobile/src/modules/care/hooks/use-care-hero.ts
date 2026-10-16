import type { HomeHero } from "@/modules/home/lib/module-home";
import { careRoutes } from "../navigation";
import { doneCount, stepsOn } from "../lib/care-math";
import { useCareToday } from "./use-care";

/** "Care · skin, hair, body · streak / 12 days". */
export function useCareHero(): HomeHero {
	const { data, streak } = useCareToday();
	if (!data.settings.setUp) return { label: "Care · let's start", value: "0", faint: " days" };
	return {
		label: "Care · skin, hair, body · streak",
		value: String(streak),
		faint: streak === 1 ? " day" : " days",
		onLabelPress: careRoutes.insights,
	};
}

/** The Overview line for Care: what's left of the routine now. */
export function useCareStatus(): string {
	const { data, record, routine, today, streak } = useCareToday();
	if (!data.settings.setUp) return "Build your routine";
	const steps = stepsOn(data.steps, routine, today);
	const done = doneCount(steps, record);
	const label = routine === "morning" ? "Morning" : "Night";
	if (steps.length > 0 && done < steps.length) return `${label} · ${done} of ${steps.length} done`;
	return streak > 0 ? `${streak} day streak` : `${label} routine done`;
}
