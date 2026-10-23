import { listItems, removeItem, saveItem } from "@/lib/db/collection";
import { newId } from "@/lib/day";
import { deleteJson, readJson } from "@/lib/storage/json-file";
import { asArray, asNumber, asString, isRecord } from "@/lib/storage/parse";
import { estimateKcal } from "../lib/kcal";
import { SKILLS, type Template } from "../lib/library";
import {
	buildProgramWeek,
	programStart,
	progressAfter,
	startingProgress,
	weekNumber,
} from "../lib/programs/engine";
import type { ChainId, FixedDay, ProgramDef, Progress } from "../lib/programs/program-model";
import type { Equipment } from "../lib/exercise-guide";
import { buildWeek, rebalance, weekDays } from "../lib/training-math";
import {
	defaultSettings,
	type Feel,
	type PlanSlot,
	type Session,
	type SetLog,
	type Skill,
	type Sport,
	type TrainingSettings,
	type WeekPlan,
} from "../lib/training-model";
import {
	trainingPlans,
	trainingPrograms,
	trainingProgress,
	trainingSessions,
	trainingSettings,
	trainingSkills,
} from "./collections";

/** Every Training write. Each saves to the record store, which refreshes the screens and syncs. */

export function saveSettings(settings: TrainingSettings): Promise<void> {
	return saveItem(trainingSettings, settings);
}

export async function savePlan(
	id: string,
	slots: readonly PlanSlot[],
	now = new Date(),
): Promise<WeekPlan> {
	const plan: WeekPlan = { id, slots: [...slots], createdAt: now.toISOString() };
	await saveItem(trainingPlans, plan);
	return plan;
}

/** The empty Home's "Build my first week": settings, this week's program and starter skills. */
export async function setUp(
	settings: TrainingSettings,
	sports: readonly Sport[],
	daysPerWeek: number,
	now = new Date(),
): Promise<void> {
	const next: TrainingSettings = { ...settings, setUp: true, sports: [...sports], daysPerWeek };
	const days = weekDays(now);
	await saveItem(trainingSettings, next);
	await savePlan(days[0] ?? "", buildWeek(next, days), now);
	const skills = new Set((await listItems(trainingSkills)).map((skill) => skill.name));
	await Promise.all(
		SKILLS.filter((skill) => sports.includes(skill.sport) && !skills.has(skill.name))
			.slice(0, 4)
			.map((skill) =>
				saveItem(trainingSkills, {
					id: newId(),
					name: skill.name,
					sport: skill.sport,
					photo: skill.photo,
					steps: skill.steps,
					done: 0,
				}),
			),
	);
}

/** The week's slots: the active program's week while it runs, else the free week by sport. */
export function weekSlots(
	settings: TrainingSettings,
	program: ProgramDef | undefined,
	days: readonly string[],
): PlanSlot[] {
	const monday = days[0] ?? "";
	if (program && settings.program) {
		const week = weekNumber(settings.program.startedOn, monday);
		if (week >= 1 && week <= program.weeks) return buildProgramWeek(program, settings, week, days);
	}
	return buildWeek(settings, days);
}

/**
 * The week's program, made if it doesn't exist yet, or remade when a program is running and this
 * week was planned without it (it was just started).
 */
export function ensureWeek(
	plan: WeekPlan | null,
	settings: TrainingSettings,
	program: ProgramDef | undefined,
	now = new Date(),
): Promise<WeekPlan> | null {
	if (!settings.setUp) return null;
	const days = weekDays(now);
	if (plan) {
		const running = program && settings.program;
		const week = running ? weekNumber(settings.program?.startedOn ?? "", days[0] ?? "") : 0;
		const planned = plan.slots.some((slot) => slot.template?.startsWith(`p:${program?.id}:`));
		if (!running || planned || week < 1 || week > program.weeks) return null;
	}
	return savePlan(days[0] ?? "", weekSlots(settings, program, days), now);
}

export type ProgramSetup = {
	daysPerWeek: number;
	minutes: number;
	equipment: Equipment[];
	fixedDays: FixedDay[];
	/** The rung someone can already do, per chain. */
	steps: Partial<Record<ChainId, number>>;
};

/**
 * Starts a program: settings, starting levels and this week's plan. Days already gone this week keep
 * what was planned, so they don't turn into missed sessions.
 */
export async function startProgram(
	settings: TrainingSettings,
	program: ProgramDef,
	setup: ProgramSetup,
	previous: WeekPlan | null,
	now = new Date(),
): Promise<void> {
	const days = weekDays(now);
	const today = days[(now.getDay() + 6) % 7] ?? "";
	const next: TrainingSettings = {
		...settings,
		setUp: true,
		program: { id: program.id, startedOn: programStart(today) },
		daysPerWeek: setup.daysPerWeek,
		minutes: setup.minutes,
		equipment: setup.equipment,
		fixedDays: setup.fixedDays,
		sports: [...new Set([...settings.sports, ...program.sports])],
	};
	const stamp = now.toISOString();
	await Promise.all(
		startingProgress(setup.steps, program, stamp).map((item) => saveItem(trainingProgress, item)),
	);
	await saveItem(trainingSettings, next);
	const planned = weekSlots(next, program, days);
	const slots = planned.map((slot): PlanSlot =>
		slot.day < today
			? (previous?.slots.find((item) => item.day === slot.day) ?? {
					day: slot.day,
					template: null,
					movedFrom: null,
				})
			: slot,
	);
	await savePlan(days[0] ?? "", slots, now);
}

/** Stops following the program; this week goes back to the free week by sport. */
export async function endProgram(settings: TrainingSettings, now = new Date()): Promise<void> {
	const next: TrainingSettings = { ...settings, program: null };
	const days = weekDays(now);
	await saveItem(trainingSettings, next);
	await savePlan(days[0] ?? "", buildWeek(next, days), now);
}

export function saveProgram(program: ProgramDef): Promise<void> {
	return saveItem(trainingPrograms, program);
}

export function deleteProgram(program: ProgramDef): Promise<void> {
	return removeItem(trainingPrograms, program.id);
}

/** Saves the level changes from a finished program session. */
export async function applyProgress(
	template: Template,
	sets: readonly SetLog[],
	feel: Feel | null,
	saved: ReadonlyMap<string, Progress>,
	now = new Date(),
): Promise<Progress[]> {
	if (!template.program) return [];
	const updates = progressAfter(template, sets, feel, saved, now.toISOString());
	await Promise.all(updates.map((item) => saveItem(trainingProgress, item)));
	return updates;
}

/** Sets one chain's or exercise's level by hand ("I can already do pull-ups"). */
export function saveProgress(progress: Progress): Promise<void> {
	return saveItem(trainingProgress, progress);
}

export function rebalanceWeek(
	plan: WeekPlan,
	sessions: readonly Session[],
	today: string,
): Promise<WeekPlan> {
	return savePlan(plan.id, rebalance(plan.slots, sessions, today));
}

export type NewSession = Omit<
	Session,
	"id" | "kcal" | "feel" | "splits" | "climbM" | "avgHr" | "note"
> &
	Partial<Pick<Session, "kcal" | "feel" | "splits" | "climbM" | "avgHr" | "note">>;

export async function logSession(input: NewSession, weightKg: number): Promise<Session> {
	const session: Session = {
		feel: null,
		splits: [],
		climbM: null,
		avgHr: null,
		note: "",
		...input,
		id: newId(),
		kcal:
			input.kcal ??
			estimateKcal(input.sport, input.durationMin, weightKg, input.distanceKm ?? undefined),
	};
	await saveItem(trainingSessions, session);
	return session;
}

export function updateSession(session: Session): Promise<void> {
	return saveItem(trainingSessions, session);
}

export function deleteSession(session: Session): Promise<void> {
	return removeItem(trainingSessions, session.id);
}

export function saveSkill(skill: Omit<Skill, "id"> & { id?: string }): Promise<void> {
	return saveItem(trainingSkills, { ...skill, id: skill.id ?? newId() });
}

export function deleteSkill(skill: Skill): Promise<void> {
	return removeItem(trainingSkills, skill.id);
}

// --- the first Workout version's file -------------------------------------------------------------

const OLD_TYPES: Record<string, Sport> = {
	strength: "calisthenics",
	run: "running",
	walk: "walk",
	cycle: "cycle",
	yoga: "yoga",
	other: "other",
};

/** Moves the first Workout version's sessions (the "workout" file) into the record store, once. */
export async function migrateOldWorkout(): Promise<number> {
	const raw = await readJson("workout");
	if (!isRecord(raw)) return 0;
	const existing = new Set((await listItems(trainingSessions)).map((session) => session.id));
	const sessions = asArray(raw.sessions, (item): Session | null => {
		if (!isRecord(item)) return null;
		const id = asString(item.id, "");
		const startedAt = asString(item.startedAt, "");
		const durationMin = asNumber(item.durationMin, -1);
		if (!id || Number.isNaN(Date.parse(startedAt)) || durationMin < 0 || existing.has(id))
			return null;
		const sport = OLD_TYPES[asString(item.type, "other")] ?? "other";
		const distance = asNumber(item.distanceKm, 0);
		const feel =
			item.feel === "easy" || item.feel === "good" || item.feel === "hard" ? item.feel : null;
		return {
			id,
			template: null,
			sport,
			title: asString(item.title, "Workout") || "Workout",
			startedAt,
			durationMin: Math.round(durationMin),
			distanceKm: distance > 0 ? distance : null,
			kcal: Math.max(0, Math.round(asNumber(item.kcal, 0))),
			feel,
			sets: [],
			rounds: null,
			splits: [],
			climbM: null,
			avgHr: null,
			note: "",
		};
	});
	await Promise.all(sessions.map((session) => saveItem(trainingSessions, session)));
	if (sessions.length > 0 && (await listItems(trainingSettings)).length === 0) {
		await saveItem(trainingSettings, defaultSettings());
	}
	await deleteJson("workout");
	return sessions.length;
}
