import { addDays, dayKey } from "@/lib/day";
import type {
	Application,
	CareerEventKind,
	CareerSettings,
	Prep,
	SkillPlan,
	SkillSession,
	Stage,
} from "./career-model";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Monday 00:00 of the week `date` falls in. */
export function startOfWeek(date: Date): Date {
	const day = startOfDay(date);
	const sinceMonday = (day.getDay() + 6) % 7;
	return addDays(day, -sinceMonday);
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: Date, to: Date): number {
	return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function weekdayShort(date: Date): string {
	return WEEKDAYS[date.getDay()] ?? "";
}

/** "8 Oct". */
export function shortDate(date: Date): string {
	return `${date.getDate()} ${MONTHS[date.getMonth()] ?? ""}`;
}

/** "Thu, 3 PM" or "Thu, 3:30 PM". */
export function dayAndTime(date: Date): string {
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const hour12 = hours % 12 === 0 ? 12 : hours % 12;
	const suffix = hours < 12 ? "AM" : "PM";
	const time =
		minutes === 0
			? `${hour12} ${suffix}`
			: `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
	return `${weekdayShort(date)}, ${time}`;
}

/** "15:00", "3pm", "3:30 pm" → minutes after midnight; null when it is not a time. */
export function parseTime(text: string): number | null {
	const match = /^\s*(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\s*$/i.exec(text);
	if (!match) return null;
	let hours = Number(match[1]);
	const minutes = match[2] ? Number(match[2]) : 0;
	const suffix = match[3]?.toLowerCase();
	if (minutes > 59 || hours > 23 || (suffix && (hours < 1 || hours > 12))) return null;
	if (suffix === "pm" && hours < 12) hours += 12;
	if (suffix === "am" && hours === 12) hours = 0;
	return hours * 60 + minutes;
}

/** The stages shown in the pipeline, in order; closed applications are left out. */
export const PIPELINE_STAGES = [
	"saved",
	"applied",
	"interview",
	"offer",
] as const satisfies readonly Stage[];
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export function pipelineCounts(apps: readonly Application[]): Record<PipelineStage, number> {
	const counts: Record<PipelineStage, number> = { saved: 0, applied: 0, interview: 0, offer: 0 };
	for (const app of apps) {
		if (app.stage !== "closed") counts[app.stage] += 1;
	}
	return counts;
}

export function lastEvent(app: Application, kind: CareerEventKind): Date | null {
	for (let index = app.events.length - 1; index >= 0; index -= 1) {
		const event = app.events[index];
		if (event?.kind === kind) return new Date(event.at);
	}
	return null;
}

/** Applications sent since Monday. */
export function appliedThisWeek(apps: readonly Application[], now: Date): number {
	const monday = startOfWeek(now).getTime();
	return apps.filter((app) =>
		app.events.some((event) => event.kind === "applied" && Date.parse(event.at) >= monday),
	).length;
}

export type FollowUp = {
	app: Application;
	dueAt: Date;
	/** Due today or overdue. */
	due: boolean;
	daysSinceApplied: number | null;
};

/** Applications waiting on a reply whose follow-up is overdue or within the next week. */
export function followUps(apps: readonly Application[], now: Date): FollowUp[] {
	const horizon = addDays(startOfDay(now), 8).getTime();
	const endOfToday = addDays(startOfDay(now), 1).getTime();
	return apps
		.filter((app) => app.stage === "applied" && app.followUpAt !== null)
		.map((app) => {
			const dueAt = new Date(app.followUpAt as string);
			const applied = lastEvent(app, "applied");
			return {
				app,
				dueAt,
				due: dueAt.getTime() < endOfToday,
				daysSinceApplied: applied ? daysBetween(applied, now) : null,
			};
		})
		.filter((item) => item.dueAt.getTime() < horizon)
		.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
}

export type ActivityItem = {
	appId: string;
	company: string;
	role: string;
	where: string;
	kind: CareerEventKind;
	at: Date;
	note: string;
};

/** Every application event, newest first. */
export function activity(apps: readonly Application[], limit = 3): ActivityItem[] {
	const items: ActivityItem[] = [];
	for (const app of apps) {
		for (const event of app.events) {
			items.push({
				appId: app.id,
				company: app.company,
				role: app.role,
				where: app.where,
				kind: event.kind,
				at: new Date(event.at),
				note: event.note,
			});
		}
	}
	return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

/** The soonest interview that has not finished (an hour of grace after its start). */
export function nextInterview(apps: readonly Application[], now: Date): Application | null {
	const after = now.getTime() - 60 * 60 * 1000;
	let best: Application | null = null;
	for (const app of apps) {
		if (app.stage === "closed" || !app.interview) continue;
		const at = Date.parse(app.interview.at);
		if (at < after) continue;
		if (!best?.interview || at < Date.parse(best.interview.at)) best = app;
	}
	return best;
}

export function prepProgress(prep: Prep | null): { done: number; total: number } {
	if (!prep) return { done: 0, total: 0 };
	return { done: prep.topics.filter((topic) => topic.done).length, total: prep.topics.length };
}

/**
 * Weeks the cash lasts at the current burn. Costs come from the settings, or else from what
 * Finance shows spent so far this month. Null when either side is unknown.
 */
export function runwayWeeks(
	settings: CareerSettings,
	spentThisMonth: number,
	now: Date,
): number | null {
	if (settings.cashOnHand === null) return null;
	const monthly =
		settings.monthlyCosts ?? (spentThisMonth > 0 ? (spentThisMonth / now.getDate()) * 30 : null);
	if (monthly === null || monthly <= 0) return null;
	const weekly = (monthly / 30) * 7;
	return Math.floor(settings.cashOnHand / weekly);
}

/** "Today · 2 applications, 1 follow-up, 30 min skill". */
export function todayLine(
	settings: CareerSettings,
	dueFollowUps: number,
	hasPlan: boolean,
): string {
	const perDay = Math.ceil(settings.weeklyTarget / 5);
	const parts = [`${perDay} application${perDay === 1 ? "" : "s"}`];
	if (dueFollowUps > 0) parts.push(`${dueFollowUps} follow-up${dueFollowUps === 1 ? "" : "s"}`);
	if (hasPlan) parts.push("30 min skill");
	return `Today · ${parts.join(", ")}`;
}

/** A plain next step from the pipeline itself; no claims the data can't back. */
export function careerTip(
	apps: readonly Application[],
	now: Date,
	settings: CareerSettings,
): string {
	const counts = pipelineCounts(apps);
	const sent = appliedThisWeek(apps, now);
	const due = followUps(apps, now).filter((item) => item.due).length;
	if (apps.length === 0) {
		return "Paste a job link and I'll fill in the company, role and pay. Aim for 2 today.";
	}
	if (due > 0) {
		return `${due} follow-up${due === 1 ? " is" : "s are"} due. A short nudge today keeps you on their list.`;
	}
	if (counts.saved > 0 && sent < settings.weeklyTarget) {
		return `${counts.saved} saved job${counts.saved === 1 ? " is" : "s are"} waiting. Apply to ${counts.saved === 1 ? "it" : "them"} before finding new ones.`;
	}
	if (sent >= settings.weeklyTarget) {
		return `${sent} applications this week — target met. Spend the time on your skill block.`;
	}
	return `${sent} of ${settings.weeklyTarget} applications this week. Two more today keeps the week on track.`;
}

// --- Skill block ------------------------------------------------------------------------------

/** Mon = 0 … Fri = 4; null at the weekend. */
export function weekdayIndex(date: Date): number | null {
	const index = (date.getDay() + 6) % 7;
	return index < 5 ? index : null;
}

/** Which week of the plan `now` falls in (0-based), held at the last week once it ends. */
export function planWeek(plan: SkillPlan, now: Date): number {
	const start = new Date(`${plan.startedOn}T00:00:00`);
	const week = Math.floor(daysBetween(start, now) / 7);
	return Math.min(plan.weeks.length - 1, Math.max(0, week));
}

export function sessionFor(
	sessions: readonly SkillSession[],
	week: number,
	day: number,
): SkillSession | null {
	return sessions.find((session) => session.week === week && session.day === day) ?? null;
}

export function weekDone(sessions: readonly SkillSession[], week: number): number {
	return sessions.filter((session) => session.week === week && session.status === "done").length;
}

/** Consecutive days with practice, counting back from today (or yesterday, before today's). */
export function skillStreak(sessions: readonly SkillSession[], now: Date): number {
	const days = new Set(sessions.map((session) => session.date));
	let cursor = startOfDay(now);
	if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1);
	let streak = 0;
	while (days.has(dayKey(cursor))) {
		streak += 1;
		cursor = addDays(cursor, -1);
	}
	return streak;
}

export type ActivityCell = "done" | "partial" | "missed";

/** The last `days` days, oldest first, for the activity grid. */
export function skillActivity(
	sessions: readonly SkillSession[],
	now: Date,
	days = 30,
): ActivityCell[] {
	const byDay = new Map<string, SkillSession["status"]>();
	for (const session of sessions) {
		if (byDay.get(session.date) !== "done") byDay.set(session.date, session.status);
	}
	const today = startOfDay(now);
	return Array.from({ length: days }, (_, index) => {
		const status = byDay.get(dayKey(addDays(today, index - days + 1)));
		return status ?? "missed";
	});
}

/** Minutes practised in the calendar month of `now`. */
export function minutesThisMonth(sessions: readonly SkillSession[], now: Date): number {
	const prefix = dayKey(now).slice(0, 7);
	return sessions
		.filter((session) => session.date.startsWith(prefix))
		.reduce((total, session) => total + session.minutes, 0);
}
