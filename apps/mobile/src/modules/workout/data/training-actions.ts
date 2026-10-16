import { listItems, removeItem, saveItem } from "@/lib/db/collection";
import { newId } from "@/lib/day";
import { deleteJson, readJson } from "@/lib/storage/json-file";
import { asArray, asNumber, asString, isRecord } from "@/lib/storage/parse";
import { estimateKcal } from "../lib/kcal";
import { SKILLS } from "../lib/library";
import { buildWeek, rebalance, weekDays } from "../lib/training-math";
import {
	defaultSettings,
	type PlanSlot,
	type Session,
	type Skill,
	type Sport,
	type TrainingSettings,
	type WeekPlan,
} from "../lib/training-model";
import { trainingPlans, trainingSessions, trainingSettings, trainingSkills } from "./collections";

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

/** The week's program, made if it doesn't exist yet. */
export function ensureWeek(
	plan: WeekPlan | null,
	settings: TrainingSettings,
	now = new Date(),
): Promise<WeekPlan> | null {
	if (plan || !settings.setUp) return null;
	const days = weekDays(now);
	return savePlan(days[0] ?? "", buildWeek(settings, days), now);
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
