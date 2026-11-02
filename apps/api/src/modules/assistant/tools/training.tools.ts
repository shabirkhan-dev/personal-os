import type { Card, ListItem } from "@personal-os/domain/assistant";
import { newId } from "@personal-os/domain/dates";
import {
	estimateKcal,
	FEELS,
	parseSession,
	type Session,
	SPORT_LABELS,
	SPORTS,
} from "@personal-os/domain/training";
import { eq } from "drizzle-orm";
import * as z from "zod";

import { onboardingProfiles } from "@/db/schema";
import { listRecords, putRecord } from "../assistant.records";
import { localClock, zonedToDate } from "../assistant.time";
import { defineTool, type ToolContext, ToolError } from "../assistant.tool";

const SESSIONS = "training-sessions";
const DAY_MS = 86_400_000;

const DAY_FORMAT = { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" } as const;
/** A shifted (local) time as "Mon 2 Nov". */
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString("en-GB", DAY_FORMAT);

/** Sessions on the person's clock (see `localClock`), newest first. */
async function load(ctx: ToolContext) {
	const clock = localClock(ctx.now, ctx.context.timeZone);
	const stored = await listRecords(ctx.db, ctx.userId, SESSIONS, parseSession);
	const sessions = stored
		.map((session) => ({ ...session, startedAt: clock.shift(session.startedAt) }))
		.toSorted((a, b) => b.startedAt.localeCompare(a.startedAt));
	return { clock, now: clock.now, sessions, stored };
}

/** Monday 00:00 of the local week containing `now` (shifted clock). */
function weekStart(now: Date): number {
	const day = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
	return day - ((now.getUTCDay() + 6) % 7) * DAY_MS;
}

/** "45 min · 5.2 km · 12 sets". */
function sessionLine(session: Session): string {
	return [
		`${session.durationMin} min`,
		session.distanceKm ? `${session.distanceKm} km` : null,
		session.sets.length ? `${session.sets.length} sets` : null,
		session.rounds ? `${session.rounds} rounds` : null,
		session.feel,
	]
		.filter(Boolean)
		.join(" · ");
}

function sessionItem(session: Session): ListItem {
	return {
		id: session.id,
		title: session.title,
		subtitle: `${dayLabel(session.startedAt)} · ${sessionLine(session)}`,
		value: session.kcal ? `${session.kcal} kcal` : undefined,
		link: { screen: "training-session", id: session.id },
	};
}

const sessionBrief = (session: Session) => ({
	id: session.id,
	day: session.startedAt.slice(0, 10),
	sport: session.sport,
	title: session.title,
	minutes: session.durationMin,
	km: session.distanceKm ?? undefined,
	sets: session.sets.length || undefined,
	feel: session.feel ?? undefined,
});

/** The best set of an exercise in a session: heaviest for lifts, else most reps or seconds. */
function bestSet(session: Session, words: readonly string[]) {
	const sets = session.sets.filter((set) => {
		const name = set.exercise.toLowerCase().replace(/-/g, " ");
		return words.every((word) => name.includes(word));
	});
	if (sets.length === 0) return null;
	return sets.reduce((best, set) =>
		(set.kg ?? 0) > (best.kg ?? 0) || ((set.kg ?? 0) === (best.kg ?? 0) && set.value > best.value)
			? set
			: best,
	);
}

const trainingOverview = defineTool({
	name: "training_overview",
	description:
		"Training at a glance: this week's sessions, minutes and calories, the last six weeks' minutes, the most recent sessions and how long since the last one. Call it first for 'how's my training', 'did I train this week'.",
	input: z.object({}).strict(),
	effect: "read",
	label: () => "Checking your training",
	run: async (ctx) => {
		const { now, sessions } = await load(ctx);
		const monday = weekStart(now);
		const thisWeek = sessions.filter((session) => Date.parse(session.startedAt) >= monday);
		const minutes = thisWeek.reduce((sum, session) => sum + session.durationMin, 0);
		const kcal = thisWeek.reduce((sum, session) => sum + session.kcal, 0);
		const weeks = Array.from({ length: 6 }, (_, index) => {
			const start = monday - (5 - index) * 7 * DAY_MS;
			const inWeek = sessions.filter((session) => {
				const at = Date.parse(session.startedAt);
				return at >= start && at < start + 7 * DAY_MS;
			});
			return {
				label:
					index === 5
						? "This wk"
						: new Date(start).toLocaleDateString("en-GB", {
								day: "numeric",
								month: "short",
								timeZone: "UTC",
							}),
				value: inWeek.reduce((sum, session) => sum + session.durationMin, 0),
				count: inWeek.length,
			};
		});
		const last = sessions[0];
		const daysSince = last
			? Math.floor((now.getTime() - Date.parse(last.startedAt)) / DAY_MS)
			: null;
		const bySport: Record<string, number> = {};
		for (const session of thisWeek)
			bySport[session.sport] = (bySport[session.sport] ?? 0) + session.durationMin;

		const cards: Card[] = [
			{
				kind: "metric",
				label: "This week",
				value: `${thisWeek.length} session${thisWeek.length === 1 ? "" : "s"} · ${minutes} min`,
				detail:
					daysSince === null
						? "Nothing logged yet"
						: daysSince === 0
							? `Trained today · ${kcal} kcal this week`
							: `Last session ${daysSince} day${daysSince === 1 ? "" : "s"} ago · ${kcal} kcal this week`,
				tone: daysSince !== null && daysSince >= 4 ? "caution" : "accent",
			},
		];
		if (sessions.length > 0) {
			cards.push({
				kind: "chart",
				title: "Minutes per week",
				style: "columns",
				unit: "min",
				points: weeks.map((week) => ({
					label: week.label,
					value: week.value,
					display: `${week.value} min`,
				})),
			});
			cards.push({
				kind: "list",
				title: "Recent sessions",
				empty: "",
				items: sessions.slice(0, 4).map(sessionItem),
			});
		}
		return {
			result: {
				thisWeek: { sessions: thisWeek.length, minutes, kcal, bySport },
				lastSixWeeks: weeks.map((week) => ({
					week: week.label,
					minutes: week.value,
					sessions: week.count,
				})),
				daysSinceLast: daysSince,
				recent: sessions.slice(0, 5).map(sessionBrief),
			},
			cards,
		};
	},
});

const findSessions = defineTool({
	name: "find_sessions",
	description:
		"Lists logged sessions, newest first, filtered by sport, words in the title or an exercise, or dates. Use it for 'when did I last run', 'my boxing this month', or to find a session before deleting it.",
	input: z
		.object({
			query: z.string().trim().max(60).optional().describe("Words from the title or an exercise."),
			sport: z.enum(SPORTS).optional(),
			from: z.iso.date().optional(),
			to: z.iso.date().optional(),
			limit: z.number().int().min(1).max(30).default(10),
		})
		.strict(),
	effect: "read",
	label: () => "Looking through your sessions",
	run: async (ctx, input) => {
		const { sessions } = await load(ctx);
		const words = (input.query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
		const found = sessions
			.filter((session) => !input.sport || session.sport === input.sport)
			.filter((session) => !input.from || session.startedAt.slice(0, 10) >= input.from)
			.filter((session) => !input.to || session.startedAt.slice(0, 10) <= input.to)
			.filter((session) => {
				const hay =
					`${session.title} ${session.note} ${session.sets.map((set) => set.exercise).join(" ")}`.toLowerCase();
				return words.every((word) => hay.includes(word));
			});
		const shown = found.slice(0, input.limit);
		const minutes = found.reduce((sum, session) => sum + session.durationMin, 0);
		return {
			result: { count: found.length, minutes, sessions: shown.map(sessionBrief) },
			cards: [
				{
					kind: "list",
					title: `${found.length} sessions · ${minutes} min`,
					items: shown.map(sessionItem),
					empty: "No sessions match.",
				},
			],
		};
	},
});

const exerciseProgress = defineTool({
	name: "exercise_progress",
	description:
		"How one exercise has gone over time: the best set of each session (heaviest for lifts, else most reps or longest hold), the all-time best and the latest. Use it for 'how are my pull-ups', 'am I getting stronger at bench'.",
	input: z
		.object({
			exercise: z
				.string()
				.trim()
				.min(2)
				.max(60)
				.describe("Words from the exercise name: 'pull up'."),
		})
		.strict(),
	effect: "read",
	label: (input) => `Checking your ${input.exercise}`,
	run: async (ctx, input) => {
		const { sessions } = await load(ctx);
		const words = input.exercise.toLowerCase().replace(/-/g, " ").split(/\s+/).filter(Boolean);
		const points = sessions
			.map((session) => ({ session, set: bestSet(session, words) }))
			.filter(
				(point): point is { session: Session; set: NonNullable<ReturnType<typeof bestSet>> } =>
					point.set !== null,
			)
			.slice(0, 12)
			.toReversed();
		if (points.length === 0) {
			const names = [
				...new Set(sessions.flatMap((session) => session.sets.map((set) => set.exercise))),
			].slice(0, 20);
			throw new ToolError(`No sets of "${input.exercise}" are logged.`, { exercisesLogged: names });
		}
		const weighted = points.some((point) => (point.set.kg ?? 0) > 0);
		const score = (set: (typeof points)[number]["set"]) => (weighted ? (set.kg ?? 0) : set.value);
		const unit = weighted ? "kg" : points[0]?.set.unit === "s" ? "s" : "reps";
		const best = points.reduce((top, point) => (score(point.set) > score(top.set) ? point : top));
		const latest = points.at(-1);
		const name = best.set.exercise;
		return {
			result: {
				exercise: name,
				unit,
				best: {
					value: score(best.set),
					reps: best.set.value,
					day: best.session.startedAt.slice(0, 10),
				},
				latest: latest
					? { value: score(latest.set), day: latest.session.startedAt.slice(0, 10) }
					: null,
				history: points.map((point) => ({
					day: point.session.startedAt.slice(0, 10),
					value: score(point.set),
				})),
			},
			cards: [
				{
					kind: "metric",
					label: `${name} · best`,
					value: weighted ? `${best.set.kg} kg × ${best.set.value}` : `${best.set.value} ${unit}`,
					detail: `On ${dayLabel(best.session.startedAt)}${latest && latest !== best ? ` · latest ${score(latest.set)} ${unit}` : ""}`,
					tone: "success",
				},
				{
					kind: "chart",
					title: `${name} · best set per session`,
					style: "columns",
					unit,
					points: points.map((point) => ({
						label: new Date(point.session.startedAt).toLocaleDateString("en-GB", {
							day: "numeric",
							month: "short",
							timeZone: "UTC",
						}),
						value: score(point.set),
						display: `${score(point.set)} ${unit}`,
						tone: point === best ? "success" : "accent",
					})),
				},
			],
		};
	},
});

async function bodyWeight(ctx: ToolContext): Promise<number> {
	const [row] = await ctx.db
		.select({ answers: onboardingProfiles.answers })
		.from(onboardingProfiles)
		.where(eq(onboardingProfiles.userId, ctx.userId));
	const weight = (row?.answers as { weightKg?: unknown } | undefined)?.weightKg;
	return typeof weight === "number" && weight > 20 && weight < 400 ? weight : 70;
}

const logSession = defineTool({
	name: "log_session",
	description:
		"Logs a workout that happened: the sport, how long, and optionally distance, how it felt, a note and the sets done (exercise, reps or seconds, kg for lifts). Calories are estimated from their weight. Today unless a date is given.",
	input: z
		.object({
			sport: z.enum(SPORTS),
			title: z
				.string()
				.trim()
				.max(80)
				.optional()
				.describe("'Push day', 'Evening run'; the sport's name when omitted."),
			minutes: z.number().int().min(1).max(600),
			distanceKm: z.number().positive().max(300).optional(),
			feel: z.enum(FEELS).optional(),
			note: z.string().trim().max(500).optional(),
			sets: z
				.array(
					z.object({
						exercise: z.string().trim().min(1).max(60),
						value: z.number().int().min(0).max(10_000).describe("Reps, or seconds for a hold."),
						unit: z.enum(["reps", "s"]).default("reps"),
						kg: z.number().positive().max(1000).optional(),
					}),
				)
				.max(60)
				.optional(),
			on: z.iso
				.date()
				.optional()
				.describe("'YYYY-MM-DD' in the person's zone; today when omitted."),
		})
		.strict(),
	effect: "write",
	label: () => "Logging the session",
	describe: async (_ctx, input) => ({
		title: `Log ${input.title || SPORT_LABELS[input.sport]}`,
		detail: [
			`${input.minutes} min`,
			input.distanceKm ? `${input.distanceKm} km` : null,
			input.sets?.length ? `${input.sets.length} sets` : null,
			input.on ? `on ${input.on}` : null,
		]
			.filter(Boolean)
			.join(" · "),
	}),
	run: async (ctx, input) => {
		const at = input.on
			? (zonedToDate(`${input.on}T18:00`, ctx.context.timeZone) ?? ctx.now)
			: new Date(ctx.now.getTime() - input.minutes * 60_000);
		const session: Session = {
			id: newId(),
			template: null,
			sport: input.sport,
			title: input.title || SPORT_LABELS[input.sport],
			startedAt: at.toISOString(),
			durationMin: input.minutes,
			distanceKm: input.distanceKm ?? null,
			kcal: estimateKcal(input.sport, input.minutes, await bodyWeight(ctx), input.distanceKm),
			feel: input.feel ?? null,
			sets: (input.sets ?? []).map((set) =>
				set.kg
					? { exercise: set.exercise, value: set.value, unit: set.unit, kg: set.kg }
					: { exercise: set.exercise, value: set.value, unit: set.unit },
			),
			rounds: null,
			splits: [],
			climbM: null,
			avgHr: null,
			note: input.note ?? "",
		};
		await putRecord(ctx.db, ctx.userId, SESSIONS, session.id, session, ctx.now.getTime());
		const { clock } = await load(ctx);
		return {
			result: { logged: sessionBrief(session), kcal: session.kcal },
			cards: [
				{
					kind: "list",
					title: "Logged",
					empty: "",
					items: [sessionItem({ ...session, startedAt: clock.shift(session.startedAt) })],
				},
			],
			changed: [SESSIONS],
			undo: [{ collection: SESSIONS, id: session.id, previous: null }],
		};
	},
});

const deleteSession = defineTool({
	name: "delete_session",
	description: "Deletes one logged session by id (find it with find_sessions first).",
	input: z.object({ id: z.string().min(1).max(64) }).strict(),
	effect: "risky",
	label: () => "Deleting the session",
	describe: async (ctx, input) => {
		const { stored } = await load(ctx);
		const session = stored.find((each) => each.id === input.id);
		if (!session) throw new ToolError("No session has that id.");
		return {
			title: `Delete ${session.title}`,
			detail: `${session.durationMin} min on ${session.startedAt.slice(0, 10)}`,
		};
	},
	run: async (ctx, input) => {
		const { stored } = await load(ctx);
		const session = stored.find((each) => each.id === input.id);
		if (!session) throw new ToolError("No session has that id. Find it with find_sessions.");
		await putRecord(ctx.db, ctx.userId, SESSIONS, session.id, session, ctx.now.getTime(), true);
		return {
			result: { deleted: sessionBrief(session) },
			changed: [SESSIONS],
			undo: [{ collection: SESSIONS, id: session.id, previous: session }],
		};
	},
});

export const trainingTools = [
	trainingOverview,
	findSessions,
	exerciseProgress,
	logSession,
	deleteSession,
];
