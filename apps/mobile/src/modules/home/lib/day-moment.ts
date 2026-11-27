import type { IconName } from "@/components/icons";
import type { ModuleId } from "@/modules/onboarding/lib/options";

/**
 * Home follows the day: which part of the day it is for this person (from their own wake and bed
 * times, not the clock alone), and what matters in it, in order. Overview leads with these and
 * reorders its cards around them.
 */

export type Moment = "morning" | "day" | "evening" | "night";

export type MomentStep = {
	id: string;
	/** The module it belongs to; its live status is shown under the title. */
	module: ModuleId;
	title: string;
	icon: IconName;
	/** A screen to open, or null to open the module's Home. */
	href: string | null;
};

const DAY = 24 * 60;

/** Minutes after `from`, going forward round the clock. */
const since = (from: number, minute: number) => (((minute - from) % DAY) + DAY) % DAY;

/**
 * Morning runs from wake for three hours, day until 17:00 (or bed if earlier), evening until two
 * hours before bed, then night until wake. Someone up at 11:00 still gets their morning.
 */
export function momentAt(minute: number, wake: number, bed: number): Moment {
	const awake = since(wake, bed) || DAY;
	const now = since(wake, minute);
	if (now >= awake) return "night";
	const morningEnd = Math.min(180, awake);
	const nightStart = Math.max(morningEnd, awake - 120);
	const eveningStart = Math.min(nightStart, Math.max(morningEnd, since(wake, 17 * 60)));
	if (now < morningEnd) return "morning";
	if (now >= nightStart) return "night";
	if (now >= eveningStart) return "evening";
	return "day";
}

export const MOMENT_TITLES: Record<Moment, { title: string; line: string }> = {
	morning: { title: "Your morning", line: "Start the day: prayer, routine, what to wear." },
	day: { title: "Your day", line: "Keep the day on track as it goes." },
	evening: { title: "Your evening", line: "Train, eat well, look at the money." },
	night: { title: "Your night", line: "Wind down and close the day." },
};

const STEPS: Record<Moment, readonly MomentStep[]> = {
	morning: [
		{
			id: "brief",
			module: "daily-life",
			title: "Morning brief",
			icon: "Sun",
			href: "/daily/brief",
		},
		{ id: "prayer", module: "faith", title: "Prayer", icon: "Moon", href: null },
		{
			id: "care-am",
			module: "skincare",
			title: "Morning routine",
			icon: "Drop",
			href: "/care/routine?routine=morning",
		},
		{ id: "outfit", module: "fashion", title: "What to wear", icon: "Shirt", href: null },
		{ id: "breakfast", module: "food", title: "Breakfast", icon: "Food", href: null },
		{
			id: "meds-am",
			module: "health",
			title: "Medicines",
			icon: "Heart",
			href: "/health/medicines",
		},
	],
	day: [
		{ id: "next-prayer", module: "faith", title: "Next prayer", icon: "Moon", href: null },
		{ id: "work", module: "career", title: "Job hunt", icon: "Briefcase", href: null },
		{ id: "meals", module: "food", title: "Meals and water", icon: "Food", href: null },
		{ id: "money", module: "finance", title: "Spending", icon: "Wallet", href: null },
		{ id: "meds", module: "health", title: "Medicines", icon: "Heart", href: "/health/medicines" },
	],
	evening: [
		{ id: "train", module: "workout", title: "Training", icon: "Dumbbell", href: null },
		{ id: "prayer-pm", module: "faith", title: "Prayer", icon: "Moon", href: null },
		{ id: "dinner", module: "food", title: "Dinner", icon: "Food", href: null },
		{ id: "money-pm", module: "finance", title: "Money today", icon: "Wallet", href: null },
	],
	night: [
		{
			id: "close",
			module: "daily-life",
			title: "Close the day",
			icon: "Check bold",
			href: "/daily/close",
		},
		{
			id: "care-pm",
			module: "skincare",
			title: "Night routine",
			icon: "Drop",
			href: "/care/routine?routine=night",
		},
		{ id: "isha", module: "faith", title: "Isha", icon: "Moon", href: null },
		{
			id: "tomorrow",
			module: "fashion",
			title: "Tomorrow's outfit",
			icon: "Shirt",
			href: "/fashion/plan",
		},
		{ id: "sleep", module: "daily-life", title: "Sleep", icon: "Moon", href: "/daily/sleep" },
	],
};

/** What matters now, for the modules this person uses, at most `limit`. */
export function momentSteps(moment: Moment, modules: readonly ModuleId[], limit = 4): MomentStep[] {
	return STEPS[moment].filter((step) => modules.includes(step.module)).slice(0, limit);
}

/** The ask bar's suggestions for this part of the day, by module, most likely first. */
export const MOMENT_ASKS: Record<Moment, readonly ModuleId[]> = {
	morning: ["faith", "food", "skincare", "fashion", "workout", "finance", "career"],
	day: ["food", "finance", "career", "faith", "workout", "skincare", "fashion"],
	evening: ["workout", "food", "finance", "faith", "skincare", "career", "fashion"],
	night: ["faith", "skincare", "finance", "food", "fashion", "workout", "career"],
};
