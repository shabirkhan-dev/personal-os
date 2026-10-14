/** The "skincare" document kept on the phone. */

export type RoutineKind = "morning" | "night";

export const ROUTINE_KINDS: readonly RoutineKind[] = ["morning", "night"];

export type Step = { id: string; name: string; detail: string };

/** Step id → ISO time it was ticked. */
export type StepsDone = Record<string, string>;

export type DayRecord = {
	morning: StepsDone;
	night: StepsDone;
	/**
	 * Routines that were fully done that day, frozen when the last step was ticked, so editing the
	 * routine later never rewrites past days (and the streak).
	 */
	finished: RoutineKind[];
};

export type Hydration = "good" | "ok" | "low";
export type Redness = "low" | "medium" | "high";

export const HYDRATION_LEVELS: readonly Hydration[] = ["good", "ok", "low"];
export const REDNESS_LEVELS: readonly Redness[] = ["low", "medium", "high"];

export type CheckIn = {
	id: string;
	dayKey: string;
	hydration: Hydration;
	redness: Redness;
	breakouts: number;
	photoUri?: string;
};

export type Product = {
	id: string;
	name: string;
	/** "YYYY-MM-DD" the current bottle was opened. */
	startedAt: string;
	lastsWeeks: number;
};

export type SkincareDoc = {
	routines: Record<RoutineKind, Step[]>;
	completions: Record<string, DayRecord>;
	checkIns: CheckIn[];
	products: Product[];
};

export const DEFAULT_ROUTINES: Record<RoutineKind, Step[]> = {
	morning: [
		{ id: "am-cleanser", name: "Cleanser", detail: "Gentle wash · 1 min" },
		{ id: "am-vitamin-c", name: "Vitamin C serum", detail: "3 drops · let it dry" },
		{ id: "am-moisturizer", name: "Moisturizer", detail: "Pea-sized amount" },
		{ id: "am-sunscreen", name: "Sunscreen SPF 50", detail: "Two fingers · face and neck" },
	],
	night: [
		{ id: "pm-cleanser", name: "Cleanser", detail: "Remove sunscreen first" },
		{ id: "pm-treatment", name: "Treatment", detail: "Retinoid or acid · thin layer" },
		{ id: "pm-moisturizer", name: "Moisturizer", detail: "Seal it in" },
	],
};

export function emptyDay(): DayRecord {
	return { morning: {}, night: {}, finished: [] };
}
