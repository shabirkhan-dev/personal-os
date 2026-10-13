import type { ColorTokens } from "@personal-os/tokens";
import type { IconName } from "@/components/icons";
import { dayRhythm, formatThousands, waterGoalLiters } from "./insights";
import type { ModuleId, WorkStyle } from "./options";
import { formatClock, wrapMinutes } from "./time";

type Tone = keyof ColorTokens;

export type PlanInput = {
	wakeMinutes: number;
	bedMinutes: number;
	workStartMinutes: number;
	workEndMinutes: number;
	workStyle: WorkStyle;
	workdays: readonly boolean[];
	modules: readonly ModuleId[];
	weightKg: number;
	calories: number;
};

export type PlanRow = {
	/** Minute of the day (0..1439). */
	minutes: number;
	time: string;
	title: string;
	meta: string;
	icon: IconName;
	iconTone: Tone;
};

const LUNCH = 13 * 60;
const WORKOUT = 18 * 60 + 30;
const WORKOUT_LENGTH = 45;

const styleLabel: Record<WorkStyle, string> = {
	office: "Office",
	remote: "Remote",
	hybrid: "Hybrid",
};

/** Frame 16 timeline: the first day built from the answers and enabled modules. */
export function buildDayPlan(input: PlanInput): PlanRow[] {
	const rhythm = dayRhythm(input.wakeMinutes, input.bedMinutes);
	const rows: PlanRow[] = [
		{
			minutes: wrapMinutes(input.wakeMinutes),
			time: formatClock(input.wakeMinutes),
			title: "Wake up",
			meta: `Morning plan at ${rhythm.morningPlan}`,
			icon: "Sun",
			iconTone: "statusCaution",
		},
	];
	if (input.workdays.some(Boolean)) {
		rows.push({
			minutes: wrapMinutes(input.workStartMinutes),
			time: formatClock(input.workStartMinutes),
			title: `Work · ${styleLabel[input.workStyle]}`,
			meta: `Until ${formatClock(input.workEndMinutes)}`,
			icon: "Filled/Calendar",
			iconTone: "accentDefault",
		});
	}
	rows.push({
		minutes: wrapMinutes(LUNCH),
		time: formatClock(LUNCH),
		title: "Lunch",
		meta: `~${formatThousands(Math.round(input.calories / 3 / 50) * 50)} kcal`,
		icon: "Food",
		iconTone: "statusCaution",
	});
	if (input.modules.includes("workout")) {
		rows.push({
			minutes: wrapMinutes(WORKOUT),
			time: formatClock(WORKOUT),
			title: "Push day",
			meta: `${WORKOUT_LENGTH} min`,
			icon: "Dumbbell",
			iconTone: "statusDanger",
		});
	}
	if (input.modules.includes("skincare")) {
		rows.push({
			minutes: wrapMinutes(input.bedMinutes - 60),
			time: formatClock(input.bedMinutes - 60),
			title: "Skincare · PM",
			meta: "4 steps",
			icon: "Drop",
			iconTone: "statusViolet",
		});
	}
	rows.push({
		minutes: wrapMinutes(input.bedMinutes),
		time: formatClock(input.bedMinutes),
		title: "Sleep",
		meta: rhythm.sleep,
		icon: "Moon",
		iconTone: "statusViolet",
	});
	return rows;
}

export type PlanHighlight = {
	value: string;
	label: string;
	icon: IconName;
	iconTone: Tone;
	tileTone: Tone;
};

/** Frame 16 goal tiles: savings and workouts when those modules are on, water always. */
export function planHighlights(input: PlanInput): PlanHighlight[] {
	const tiles: PlanHighlight[] = [];
	if (input.modules.includes("finance")) {
		tiles.push({
			value: "Rs 8,000",
			label: "saved / mo",
			icon: "Wallet",
			iconTone: "statusCaution",
			tileTone: "statusCautionSubtle",
		});
	}
	if (input.modules.includes("workout")) {
		tiles.push({
			value: "3×",
			label: "workouts / wk",
			icon: "Dumbbell",
			iconTone: "statusDanger",
			tileTone: "bgSubtle",
		});
	}
	tiles.push({
		value: `${waterGoalLiters(input.weightKg).toFixed(1)} L`,
		label: "water / day",
		icon: "Drop",
		iconTone: "accentDefault",
		tileTone: "accentSubtle",
	});
	return tiles;
}

export type RhythmSegment = { start: number; end: number; tone: Tone; id: string };

/** 24-hour bar segments in minutes (sleep wraps midnight, so it can split in two). */
export function rhythmSegments(input: PlanInput): RhythmSegment[] {
	const segments: RhythmSegment[] = [];
	if (input.bedMinutes > input.wakeMinutes) {
		segments.push({ id: "sleep-early", start: 0, end: input.wakeMinutes, tone: "statusViolet" });
		segments.push({
			id: "sleep-late",
			start: input.bedMinutes,
			end: 24 * 60,
			tone: "statusViolet",
		});
	} else {
		segments.push({
			id: "sleep",
			start: input.bedMinutes,
			end: input.wakeMinutes,
			tone: "statusViolet",
		});
	}
	if (input.workdays.some(Boolean)) {
		segments.push({
			id: "work",
			start: input.workStartMinutes,
			end: input.workEndMinutes,
			tone: "accentDefault",
		});
	}
	if (input.modules.includes("workout")) {
		segments.push({
			id: "workout",
			start: WORKOUT,
			end: WORKOUT + WORKOUT_LENGTH,
			tone: "statusDanger",
		});
	}
	const plan = wrapMinutes(input.wakeMinutes + 10);
	segments.push({ id: "plan", start: plan, end: plan + 15, tone: "statusCaution" });
	return segments;
}
