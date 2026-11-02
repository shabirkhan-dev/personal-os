import { SPORTS, type Sport } from "@personal-os/domain/training";
import { asArray, asBoolean, asNumber, asString, isRecord, oneOf } from "@/lib/storage/parse";
import { EQUIPMENT, type Equipment } from "./exercise-guide";
import type { ActiveProgram, FixedDay } from "./programs/program-model";

/**
 * Training's documents: settings (sports, days a week, phase), the week's program, logged
 * sessions with their sets, rounds or splits, and skills worked toward step by step. Each is read
 * back through `parse` so an older or damaged row becomes a valid value.
 */

/** One day of the week's program; the id of the plan is that week's Monday. */
export type PlanSlot = { day: string; template: string | null; movedFrom: string | null };
export type WeekPlan = { id: string; slots: PlanSlot[]; createdAt: string };

export type Skill = {
	id: string;
	name: string;
	sport: Sport;
	photo: string | null;
	steps: string[];
	/** Steps done so far; equal to steps.length when the skill is done. */
	done: number;
};

export type TrainingSettings = {
	id: "settings";
	setUp: boolean;
	sports: Sport[];
	daysPerWeek: number;
	phase: 1 | 2 | 3;
	/** Minutes after midnight. */
	trainAt: number;
	stepsGoal: number;
	activeGoal: number;
	moveGoal: number;
	/** The program being followed, and the Monday it started; null for the free week. */
	program: ActiveProgram | null;
	/** What someone can train with; exercises that need anything else are swapped. */
	equipment: Equipment[];
	/** Team sport days the week is built around. */
	fixedDays: FixedDay[];
	/** Usual session length; longer strength sessions are trimmed to fit. */
	minutes: number;
};

export {
	FEELS,
	type Feel,
	parseSession,
	type Session,
	type SetLog,
	SPORT_LABELS,
	SPORTS,
	type Sport,
} from "@personal-os/domain/training";

export const SESSION_LENGTHS = [20, 30, 45, 60] as const;

// --- parsing ------------------------------------------------------------------------------------

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const asDay = (value: unknown) => (typeof value === "string" && DAY.test(value) ? value : null);
const asIso = (value: unknown) =>
	typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;

export function defaultSettings(): TrainingSettings {
	return {
		id: "settings",
		setUp: false,
		sports: ["calisthenics", "running", "boxing"],
		daysPerWeek: 5,
		phase: 1,
		trainAt: 18 * 60 + 30,
		stepsGoal: 8000,
		activeGoal: 450,
		moveGoal: 45,
		program: null,
		equipment: ["pull-up-bar"],
		fixedDays: [],
		minutes: 45,
	};
}

export function parseSettings(raw: unknown): TrainingSettings | null {
	if (!isRecord(raw)) return null;
	const base = defaultSettings();
	const sports = asArray(raw.sports, (item) =>
		typeof item === "string" && (SPORTS as readonly string[]).includes(item)
			? (item as Sport)
			: null,
	);
	const phase = asNumber(raw.phase, 1);
	return {
		id: "settings",
		setUp: asBoolean(raw.setUp, false),
		sports: sports.length > 0 ? [...new Set(sports)] : base.sports,
		daysPerWeek: Math.min(7, Math.max(1, Math.round(asNumber(raw.daysPerWeek, base.daysPerWeek)))),
		phase: phase === 2 || phase === 3 ? phase : 1,
		trainAt: Math.min(1439, Math.max(0, Math.round(asNumber(raw.trainAt, base.trainAt)))),
		stepsGoal: Math.max(1000, Math.round(asNumber(raw.stepsGoal, base.stepsGoal))),
		activeGoal: Math.max(50, Math.round(asNumber(raw.activeGoal, base.activeGoal))),
		moveGoal: Math.max(10, Math.round(asNumber(raw.moveGoal, base.moveGoal))),
		program: parseActive(raw.program),
		equipment: Array.isArray(raw.equipment)
			? [
					...new Set(
						asArray(raw.equipment, (item) =>
							typeof item === "string" && (EQUIPMENT as readonly string[]).includes(item)
								? (item as Equipment)
								: null,
						),
					),
				]
			: base.equipment,
		fixedDays: parseFixedDays(raw.fixedDays),
		minutes: Math.min(120, Math.max(15, Math.round(asNumber(raw.minutes, base.minutes)))),
	};
}

function parseActive(raw: unknown): ActiveProgram | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const startedOn = asDay(raw.startedOn);
	return id && startedOn ? { id, startedOn } : null;
}

function parseFixedDays(raw: unknown): FixedDay[] {
	const days = asArray(raw, (item): FixedDay | null => {
		if (!isRecord(item)) return null;
		const weekday = Math.round(asNumber(item.weekday, -1));
		if (weekday < 0 || weekday > 6) return null;
		const activity = asString(item.activity, "");
		if (activity) return { weekday, activity: activity.slice(0, 60) };
		// Team days saved before activities existed pointed at a sport.
		const sport = asString(item.sport, "");
		return (SPORTS as readonly string[]).includes(sport)
			? { weekday, activity: `sport:${sport}` }
			: null;
	});
	const seen = new Set<number>();
	return days.filter((day) => !seen.has(day.weekday) && seen.add(day.weekday));
}

export function parsePlan(raw: unknown): WeekPlan | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	if (!id) return null;
	return {
		id,
		slots: asArray(raw.slots, (item) => {
			if (!isRecord(item)) return null;
			const day = asDay(item.day);
			if (!day) return null;
			return {
				day,
				template: typeof item.template === "string" && item.template ? item.template : null,
				movedFrom: asDay(item.movedFrom),
			};
		}).sort((a, b) => a.day.localeCompare(b.day)),
		createdAt: asIso(raw.createdAt) ?? new Date(0).toISOString(),
	};
}

export function parseSkill(raw: unknown): Skill | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const name = asString(raw.name, "").trim();
	const steps = asArray(raw.steps, (item) =>
		typeof item === "string" && item.trim() ? item.trim().slice(0, 120) : null,
	);
	if (!id || !name || steps.length === 0) return null;
	return {
		id,
		name: name.slice(0, 60),
		sport: oneOf(raw.sport, SPORTS, "calisthenics"),
		photo: typeof raw.photo === "string" && raw.photo ? raw.photo : null,
		steps,
		done: Math.min(steps.length, Math.max(0, Math.round(asNumber(raw.done, 0)))),
	};
}
