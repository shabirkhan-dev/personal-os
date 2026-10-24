import { addDays, dayKey } from "@/lib/day";
import { type Template, TEMPLATES, templateById } from "./library";
import type { PlanSlot, Session, Sport, TrainingSettings, WeekPlan } from "./training-model";

/** The numbers behind Training's screens. Pure, so they're tested without a phone. */

const dateOf = (day: string) => new Date(`${day}T12:00:00`);

/** Monday to Sunday of the week `date` is in. */
export function weekDays(date: Date): string[] {
	const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
	return Array.from({ length: 7 }, (_, step) => dayKey(addDays(monday, step)));
}

// --- the week -----------------------------------------------------------------------------------

const BY_SPORT: Partial<Record<Sport, readonly string[]>> = {
	calisthenics: ["pull-core", "push-handstand", "legs-core"],
	running: ["easy-run", "long-run"],
	boxing: ["shadow-boxing"],
	football: ["football"],
	volleyball: ["volleyball"],
	yoga: ["mobility"],
};

/** Which weekdays (0 = Monday) get a session, spread so hard days don't stack. */
export const SPREAD: Record<number, number[]> = {
	1: [2],
	2: [1, 4],
	3: [0, 2, 4],
	4: [0, 1, 3, 4],
	5: [0, 1, 2, 4, 5],
	6: [0, 1, 2, 3, 4, 5],
	7: [0, 1, 2, 3, 4, 5, 6],
};

/** The order sports take turns in: strength first, then running, boxing and team sports. */
const MAIN: readonly Sport[] = ["calisthenics", "running", "boxing", "football", "volleyball"];

/**
 * A week from the sports picked and days a week: sessions take turns by sport (pull, run, box,
 * push, long run…), and the free days get mobility when yoga is picked, else rest.
 */
export function buildWeek(settings: TrainingSettings, days: readonly string[]): PlanSlot[] {
	const mains = MAIN.filter((sport) => settings.sports.includes(sport));
	const pool = mains.length > 0 ? mains : (["calisthenics"] as Sport[]);
	const used: Partial<Record<Sport, number>> = {};
	const on = new Set(SPREAD[settings.daysPerWeek] ?? SPREAD[5]);
	let turn = 0;
	return days.map((day, index) => {
		if (!on.has(index)) {
			return {
				day,
				template: settings.sports.includes("yoga") ? "mobility" : null,
				movedFrom: null,
			};
		}
		const sport = pool[turn % pool.length] ?? "calisthenics";
		turn += 1;
		const list = BY_SPORT[sport] ?? ["pull-core"];
		const count = used[sport] ?? 0;
		used[sport] = count + 1;
		return { day, template: list[count % list.length] ?? null, movedFrom: null };
	});
}

export type SlotState = "done" | "missed" | "today" | "planned" | "rest";

/** A session counts for a slot when it's the same template, or the same sport, that day. */
export function sessionFor(slot: PlanSlot, sessions: readonly Session[]): Session | null {
	const template = templateById(slot.template);
	return (
		sessions.find(
			(session) =>
				dayKey(new Date(session.startedAt)) === slot.day &&
				(session.template === slot.template ||
					(template !== undefined && session.sport === template.sport)),
		) ?? null
	);
}

export function slotState(slot: PlanSlot, sessions: readonly Session[], today: string): SlotState {
	if (!slot.template) return "rest";
	if (sessionFor(slot, sessions)) return "done";
	if (slot.day < today) return "missed";
	return slot.day === today ? "today" : "planned";
}

/** Easy days: rest or mobility, where a missed session can move to. */
const easy = (slot: PlanSlot) => slot.template === null || slot.template === "mobility";

/**
 * Moves each missed session to the next easy day still ahead this week (not today if today
 * already has a session), noting where it came from. Days already moved stay put.
 */
export function rebalance(
	slots: readonly PlanSlot[],
	sessions: readonly Session[],
	today: string,
): PlanSlot[] {
	const next = slots.map((slot) => ({ ...slot }));
	for (const slot of next) {
		if (slotState(slot, sessions, today) !== "missed" || slot.template === "mobility") continue;
		if (next.some((other) => other.movedFrom === slot.day)) continue;
		const target = next.find((other) => other.day > today && easy(other) && !other.movedFrom);
		if (!target) continue;
		target.template = slot.template;
		target.movedFrom = slot.day;
	}
	return next;
}

export function weekCount(
	plan: WeekPlan | null,
	sessions: readonly Session[],
	days: readonly string[],
) {
	const goal = plan
		? plan.slots.filter((slot) => slot.template && slot.template !== "mobility").length
		: 0;
	const done = sessions.filter(
		(session) => days.includes(dayKey(new Date(session.startedAt))) && session.sport !== "walk",
	).length;
	return { done, goal };
}

// --- numbers ------------------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");

/** "27:40", "1:05:12". */
export function clockTime(totalSeconds: number): string {
	const seconds = Math.max(0, Math.round(totalSeconds));
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;
	return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Seconds per km for a run, or null without a distance. */
export function paceOf(session: Pick<Session, "durationMin" | "distanceKm">): number | null {
	return session.distanceKm ? (session.durationMin * 60) / session.distanceKm : null;
}

/** "Run · easy · 5.0 km · 27:40 · 5:31 /km" style line for a logged session. */
export function sessionLine(session: Session): string {
	if (session.distanceKm) {
		const pace = paceOf(session);
		return `${session.distanceKm.toFixed(1)} km · ${clockTime(session.durationMin * 60)}${pace ? ` · ${clockTime(pace)} /km` : ""}`;
	}
	if (session.rounds) return `${session.rounds} rounds · ${session.durationMin} min`;
	const best = session.sets
		.filter((set) => set.unit === "reps")
		.sort((a, b) => b.value - a.value)[0];
	return `${session.durationMin} min${best ? ` · ${best.value} ${best.exercise.toLowerCase()} best` : ""}`;
}

/** The last reps (or seconds) logged for an exercise, for "Last time 9 · beat it by one". */
export function lastValue(
	sessions: readonly Session[],
	exercise: string,
	before?: string,
): number | null {
	const sorted = [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
	for (const session of sorted) {
		if (before && session.startedAt >= before) continue;
		const sets = session.sets.filter((set) => set.exercise === exercise);
		if (sets.length > 0) return Math.max(...sets.map((set) => set.value));
	}
	return null;
}

export type Best = { label: string; value: string; change: string | null; fresh: boolean };

function bestReps(name: RegExp, list: readonly Session[]): number {
	return Math.max(
		0,
		...list.flatMap((session) =>
			session.sets
				.filter((set) => name.test(set.exercise) && set.unit === "reps")
				.map((set) => set.value),
		),
	);
}

function best5k(list: readonly Session[]): number | null {
	const times = list
		.filter((session) => session.distanceKm && session.distanceKm >= 4.9)
		.map((session) => (session.durationMin * 60 * 5) / (session.distanceKm ?? 5));
	return times.length ? Math.min(...times) : null;
}

/** Personal bests: most pull-ups and push-ups in a set, fastest 5 km; compared with 2 weeks ago. */
export function personalBests(sessions: readonly Session[], now: Date): Best[] {
	const cutoff = addDays(now, -14).toISOString();
	const older = sessions.filter((session) => session.startedAt < cutoff);
	const out: Best[] = [];
	for (const [label, pattern] of [
		["Pull-ups", /^pull-ups$/i],
		["Push-ups", /^push-ups$/i],
	] as const) {
		const best = bestReps(pattern, sessions);
		if (best <= 0) continue;
		const before = bestReps(pattern, older);
		out.push({
			label,
			value: String(best),
			change: before > 0 && best > before ? `▲ ${best - before}` : null,
			fresh: before === 0,
		});
	}
	const run = best5k(sessions);
	if (run !== null) {
		const before = best5k(older);
		out.push({
			label: "5 km",
			value: clockTime(run),
			change: before !== null && run < before ? `▼ ${clockTime(before - run)}` : null,
			fresh: before === null,
		});
	}
	return out;
}

export function sessionsOnDay(sessions: readonly Session[], day: string): Session[] {
	return sessions.filter((session) => dayKey(new Date(session.startedAt)) === day);
}

export function runKm(sessions: readonly Session[], days: readonly string[]): number {
	return (
		Math.round(
			sessionsOnDays(sessions, days).reduce((sum, session) => sum + (session.distanceKm ?? 0), 0) *
				10,
		) / 10
	);
}

export function sessionsOnDays(sessions: readonly Session[], days: readonly string[]): Session[] {
	const set = new Set(days);
	return sessions.filter((session) => set.has(dayKey(new Date(session.startedAt))));
}

/** Negative split: every km at least as fast as the one before. */
export function negativeSplit(splits: readonly number[]): boolean {
	return (
		splits.length >= 2 &&
		splits.every((value, index) => index === 0 || value <= (splits[index - 1] ?? value))
	);
}

// --- insights -----------------------------------------------------------------------------------

export type TrainingNote =
	| { kind: "pull-ups"; best: number; change: number }
	| { kind: "boxing"; weeks: number }
	| { kind: "long-run"; day: string; km: number }
	| { kind: "missed"; title: string; movedTo: string | null };

/** Weeks in a row (ending this week) with at least one session of `sport`. */
export function weeksInARow(sessions: readonly Session[], sport: Sport, now: Date): number {
	let count = 0;
	for (let back = 0; back < 52; back += 1) {
		const days = weekDays(addDays(now, -7 * back));
		const any = sessionsOnDays(sessions, days).some((session) => session.sport === sport);
		if (!any) {
			if (back === 0) continue;
			break;
		}
		count += 1;
	}
	return count;
}

export function trainingNotes(input: {
	sessions: readonly Session[];
	plan: WeekPlan | null;
	today: string;
	now: Date;
}): TrainingNote[] {
	const notes: TrainingNote[] = [];
	const pulls = personalBests(input.sessions, input.now).find((best) => best.label === "Pull-ups");
	if (pulls?.change)
		notes.push({
			kind: "pull-ups",
			best: Number(pulls.value),
			change: Number(pulls.change.replace(/\D/g, "")),
		});
	const tomorrow = dayKey(addDays(input.now, 1));
	const long = input.plan?.slots.find(
		(slot) => slot.day >= input.today && slot.day <= tomorrow && slot.template === "long-run",
	);
	if (long)
		notes.push({ kind: "long-run", day: long.day, km: templateById("long-run")?.distanceKm ?? 8 });
	const missed = input.plan?.slots.find(
		(slot) =>
			slotState(slot, input.sessions, input.today) === "missed" && slot.template !== "mobility",
	);
	if (missed) {
		const moved = input.plan?.slots.find((slot) => slot.movedFrom === missed.day);
		notes.push({
			kind: "missed",
			title: templateById(missed.template)?.title ?? "A session",
			movedTo: moved?.day ?? null,
		});
	}
	const boxing = weeksInARow(input.sessions, "boxing", input.now);
	if (boxing >= 2) notes.push({ kind: "boxing", weeks: boxing });
	return notes;
}

export function templatesFor(sports: readonly Sport[]): Template[] {
	return TEMPLATES.filter((template) => sports.includes(template.sport));
}

export function weekdayShort(day: string): string {
	return ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][dateOf(day).getDay()] ?? "";
}

// --- rounds -------------------------------------------------------------------------------------

export type RoundState = {
	round: number;
	work: boolean;
	left: number;
	done: boolean;
	withinWork: number;
};

/** Where a rounds session stands after `elapsed` seconds. */
export function roundAt(elapsed: number, rounds: number, workS: number, restS: number): RoundState {
	const cycle = workS + restS;
	const index = Math.floor(elapsed / cycle);
	if (index >= rounds || (index === rounds - 1 && elapsed % cycle >= workS)) {
		return { round: rounds, work: false, left: 0, done: true, withinWork: 0 };
	}
	const within = elapsed % cycle;
	const work = within < workS;
	return {
		round: index + 1,
		work,
		left: work ? workS - within : cycle - within,
		done: false,
		withinWork: work ? within : 0,
	};
}

/** The week with `day` set to `template` (null for rest). */
export function withSlot(
	slots: readonly PlanSlot[],
	day: string,
	template: string | null,
): PlanSlot[] {
	const next: PlanSlot[] = [];
	for (const slot of slots) next.push(slot.day === day ? { day, template, movedFrom: null } : slot);
	return next;
}
