import { addDays, dayKey } from "@/lib/day";
import type { Activity } from "./activities";
import { exerciseByName, PATTERN_LABELS, type Pattern } from "./exercise-guide";
import { parseTemplateId, programById, weekKind } from "./programs/engine";
import type { ProgramDef } from "./programs/program-model";
import { sessionFor, weekDays } from "./training-math";
import type { Feel, Session, WeekPlan } from "./training-model";

/** What Training learns from what was logged. Pure, so it is tested without a phone. */

const dayOf = (session: Session) => dayKey(new Date(session.startedAt));

/** Estimated one-rep max (Epley); a single rep is the lift itself. */
export function estimatedMax(kg: number, reps: number): number {
	if (reps <= 1) return kg;
	return Math.round(kg * (1 + reps / 30) * 2) / 2;
}

/** Exercises with logged sets, most sets first. */
export function loggedExercises(sessions: readonly Session[]): { name: string; sets: number }[] {
	const counts = new Map<string, number>();
	for (const session of sessions) {
		for (const set of session.sets) counts.set(set.exercise, (counts.get(set.exercise) ?? 0) + 1);
	}
	return [...counts.entries()]
		.map(([name, sets]) => ({ name, sets }))
		.sort((a, b) => b.sets - a.sets || a.name.localeCompare(b.name));
}

export type HistoryPoint = {
	day: string;
	/** The best set that day: reps, seconds, or kilograms for weighted lifts. */
	best: number;
	unit: "reps" | "s" | "kg";
	/** Weighted lifts: the estimated one-rep max that day. */
	max: number | null;
	sets: number;
};

/** One exercise over time, a point per day it was trained, oldest first. */
export function exerciseHistory(sessions: readonly Session[], name: string): HistoryPoint[] {
	const byDay = new Map<string, HistoryPoint>();
	for (const session of sessions) {
		const sets = session.sets.filter((set) => set.exercise === name);
		if (sets.length === 0) continue;
		const day = dayOf(session);
		const weighted = sets.some((set) => set.kg !== undefined);
		const best = weighted
			? Math.max(...sets.map((set) => set.kg ?? 0))
			: Math.max(...sets.map((set) => set.value));
		const max = weighted
			? Math.max(...sets.map((set) => estimatedMax(set.kg ?? 0, set.value)))
			: null;
		const unit = weighted ? "kg" : (sets[0]?.unit ?? "reps");
		const previous = byDay.get(day);
		byDay.set(day, {
			day,
			best: Math.max(best, previous?.best ?? 0),
			unit,
			max: max === null ? null : Math.max(max, previous?.max ?? 0),
			sets: sets.length + (previous?.sets ?? 0),
		});
	}
	return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

export type ExerciseRecord = { name: string; best: string; day: string };

/** Each exercise's best: most reps, longest hold, or heaviest estimated max. */
export function records(sessions: readonly Session[], limit = 6): ExerciseRecord[] {
	return loggedExercises(sessions)
		.slice(0, 20)
		.map(({ name }) => {
			const history = exerciseHistory(sessions, name);
			const top = [...history].sort((a, b) => (b.max ?? b.best) - (a.max ?? a.best))[0];
			if (!top) return null;
			const best =
				top.unit === "kg"
					? `${top.best} kg · est. max ${top.max} kg`
					: top.unit === "s"
						? `${top.best} s`
						: `${top.best} reps`;
			return { name, best, day: top.day };
		})
		.filter((item): item is ExerciseRecord => item !== null)
		.slice(0, limit);
}

/** Sets per movement pattern over the last `weeks` weeks (built-in patterns; others are "Other"). */
export function volumeByPattern(
	sessions: readonly Session[],
	now: Date,
	weeks = 1,
): { pattern: string; sets: number }[] {
	const from = dayKey(addDays(now, -7 * weeks + 1));
	const counts = new Map<string, number>();
	for (const session of sessions) {
		if (dayOf(session) < from) continue;
		for (const set of session.sets) {
			const pattern = exerciseByName(set.exercise)?.pattern;
			const label = pattern ? PATTERN_LABELS[pattern as Pattern] : "Other";
			counts.set(label, (counts.get(label) ?? 0) + 1);
		}
	}
	return [...counts.entries()]
		.map(([pattern, sets]) => ({ pattern, sets }))
		.sort((a, b) => b.sets - a.sets);
}

export type WeekAdherence = { monday: string; planned: number; done: number };

/** Planned sessions against sessions done, for the last `weeks` weeks (this week so far). */
export function adherence(
	plans: readonly WeekPlan[],
	sessions: readonly Session[],
	now: Date,
	weeks = 6,
): WeekAdherence[] {
	const today = dayKey(now);
	return Array.from({ length: weeks }, (_, index) => {
		const days = weekDays(addDays(now, -7 * (weeks - 1 - index)));
		const monday = days[0] ?? today;
		const plan = plans.find((item) => item.id === monday);
		const slots = (plan?.slots ?? []).filter((slot) => slot.template && slot.day <= today);
		return {
			monday,
			planned: slots.length,
			done: slots.filter((slot) => sessionFor(slot, sessions) !== null).length,
		};
	});
}

/** Share of planned sessions done over the weeks given, or null with nothing planned. */
export function adherenceShare(weeks: readonly WeekAdherence[]): number | null {
	const planned = weeks.reduce((sum, week) => sum + week.planned, 0);
	if (planned === 0) return null;
	return weeks.reduce((sum, week) => sum + week.done, 0) / planned;
}

export type ActivityTotal = {
	activity: Activity;
	count: number;
	minutes: number;
	km: number;
	/** Sums of the activity's own numbers ("goals": 7). */
	metrics: { label: string; unit: string; total: number }[];
};

/** Each activity's totals over the days given. */
export function activityTotals(
	sessions: readonly Session[],
	activities: readonly Activity[],
	days: readonly string[],
): ActivityTotal[] {
	const inRange = new Set(days);
	return activities
		.map((activity) => {
			const done = sessions.filter(
				(session) => session.activity === activity.id && inRange.has(dayOf(session)),
			);
			return {
				activity,
				count: done.length,
				minutes: done.reduce((sum, session) => sum + session.durationMin, 0),
				km: Math.round(done.reduce((sum, session) => sum + (session.distanceKm ?? 0), 0) * 10) / 10,
				metrics: activity.metrics.map((metric) => ({
					label: metric.label,
					unit: metric.unit,
					total: done.reduce((sum, session) => sum + (session.metrics?.[metric.key] ?? 0), 0),
				})),
			};
		})
		.filter((total) => total.count > 0)
		.sort((a, b) => b.count - a.count);
}

export type TestResult = {
	day: string;
	program: string;
	week: number;
	sets: { exercise: string; value: number; unit: string }[];
};

/** Program test-week sessions with their all-out sets, newest first. */
export function testResults(
	sessions: readonly Session[],
	programs: readonly ProgramDef[],
): TestResult[] {
	const results: TestResult[] = [];
	for (const session of sessions) {
		const parsed = session.template ? parseTemplateId(session.template) : null;
		const program = parsed ? programById(programs, parsed.programId) : undefined;
		if (
			!parsed ||
			!program ||
			weekKind(program, parsed.week) !== "test" ||
			session.sets.length === 0
		)
			continue;
		results.push({
			day: dayOf(session),
			program: program.title,
			week: parsed.week,
			sets: session.sets.map((set) => ({
				exercise: set.exercise,
				value: set.value,
				unit: set.unit === "s" ? "s" : "reps",
			})),
		});
	}
	return results.sort((a, b) => b.day.localeCompare(a.day));
}

export type Readiness = {
	level: "push" | "steady" | "easy";
	/** 0 (rest) to 100 (fresh). */
	score: number;
	reasons: string[];
};

/**
 * How ready someone is today, from last night's sleep (when Daily life has it), how the last
 * sessions felt and how many days in a row they trained.
 */
export function readiness(input: {
	sleptMinutes: number | null;
	sessions: readonly Session[];
	now: Date;
}): Readiness {
	const { sleptMinutes, sessions, now } = input;
	let score = 75;
	const reasons: string[] = [];
	if (sleptMinutes !== null) {
		const hours = sleptMinutes / 60;
		if (hours < 6) {
			score -= 25;
			reasons.push(`Slept ${hours.toFixed(1)} h`);
		} else if (hours >= 7.5) {
			score += 10;
			reasons.push(`Slept ${hours.toFixed(1)} h`);
		}
	}
	const recent = [...sessions]
		.sort((a, b) => b.startedAt.localeCompare(a.startedAt))
		.slice(0, 3)
		.map((session) => session.feel)
		.filter((feel): feel is Feel => feel !== null);
	const hard = recent.filter((feel) => feel === "hard").length;
	if (hard >= 2) {
		score -= 20;
		reasons.push(`${hard} of the last sessions felt hard`);
	} else if (recent.length > 0 && recent.every((feel) => feel === "easy")) {
		score += 10;
		reasons.push("Recent sessions felt easy");
	}
	let streak = 0;
	for (let day = addDays(now, -1); streak < 14; day = addDays(day, -1)) {
		const key = dayKey(day);
		if (!sessions.some((session) => dayOf(session) === key)) break;
		streak += 1;
	}
	if (streak >= 5) {
		score -= 20;
		reasons.push(`${streak} days in a row`);
	} else if (streak === 0 && sessions.length > 0) {
		score += 5;
		reasons.push("Rested yesterday");
	}
	score = Math.max(0, Math.min(100, score));
	return { level: score >= 75 ? "push" : score >= 50 ? "steady" : "easy", score, reasons };
}
