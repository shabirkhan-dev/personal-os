import { addDays, dayKey } from "@/lib/day";
import { followUps, lastEvent, nextInterview, startOfWeek } from "./career-math";
import type { Application, CareerSettings, Prep, SkillSession } from "./career-model";

export type CareerRange = "week" | "last" | "month";

/** The range as [start, end): this week so far, last week, or this calendar month. */
export function rangeBounds(range: CareerRange, now: Date): { start: Date; end: Date } {
	const monday = startOfWeek(now);
	if (range === "week") return { start: monday, end: now };
	if (range === "last") return { start: addDays(monday, -7), end: monday };
	return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
}

export type CareerRecap = {
	/** Applications sent in the range. */
	applied: number;
	/** Applications that got an interview or an offer in the range: someone wrote back. */
	replies: number;
	/** Applications closed in the range. */
	closed: number;
	/** Interviews held or booked in the range. */
	interviews: number;
	/** Minutes on the skill path in the range. */
	skillMinutes: number;
	/** The weekly target scaled to the range (a month is about four weeks). */
	target: number;
};

const within = (at: string, start: Date, end: Date) => {
	const time = Date.parse(at);
	return time >= start.getTime() && time < end.getTime();
};

/** What the job hunt added up to over the range. */
export function careerRecap(
	apps: readonly Application[],
	sessions: readonly SkillSession[],
	settings: CareerSettings,
	range: CareerRange,
	now: Date,
): CareerRecap {
	const { start, end } = rangeBounds(range, now);
	const had = (app: Application, kinds: readonly string[]) =>
		app.events.some((event) => kinds.includes(event.kind) && within(event.at, start, end));
	const from = dayKey(start);
	// Sessions are stored by day: the range's last day is the Sunday before this Monday for last week.
	const to = dayKey(range === "last" ? addDays(end, -1) : now);
	return {
		applied: apps.filter((app) => had(app, ["applied"])).length,
		replies: apps.filter((app) => had(app, ["interview", "offer"])).length,
		closed: apps.filter((app) => had(app, ["closed"])).length,
		interviews: apps.filter((app) => app.interview && within(app.interview.at, start, end)).length,
		skillMinutes: sessions
			.filter((session) => session.date >= from && session.date <= to)
			.reduce((total, session) => total + session.minutes, 0),
		target: range === "month" ? settings.weeklyTarget * 4 : settings.weeklyTarget,
	};
}

export type CareerNote =
	| { kind: "behind"; applied: number; target: number; daysLeft: number }
	| { kind: "follow-ups"; count: number }
	| { kind: "prep"; app: Application; days: number; done: number; total: number }
	| { kind: "no-replies"; applied: number };

/** What the Insights screen noticed this week, most urgent first. */
export function careerNotes(input: {
	apps: readonly Application[];
	preps: readonly Prep[];
	settings: CareerSettings;
	now: Date;
}): CareerNote[] {
	const { apps, preps, settings, now } = input;
	const notes: CareerNote[] = [];

	const interview = nextInterview(apps, now);
	if (interview?.interview) {
		const days = Math.max(
			0,
			Math.round((Date.parse(interview.interview.at) - now.getTime()) / 86_400_000),
		);
		const prep = preps.find((item) => item.id === interview.id) ?? null;
		const total = prep?.topics.length ?? 0;
		const done = prep?.topics.filter((topic) => topic.done).length ?? 0;
		if (days <= 3 && (total === 0 || done < total)) {
			notes.push({ kind: "prep", app: interview, days, done, total });
		}
	}

	const due = followUps(apps, now).filter((item) => item.due).length;
	if (due > 0) notes.push({ kind: "follow-ups", count: due });

	// From Wednesday on, so a quiet Monday isn't flagged; and not before the first job is added,
	// when the empty screen already says what to do.
	const week = careerRecap(apps, [], settings, "week", now);
	const weekday = (now.getDay() + 6) % 7;
	if (apps.length > 0 && weekday >= 2 && week.applied < settings.weeklyTarget * (weekday / 5)) {
		notes.push({
			kind: "behind",
			applied: week.applied,
			target: settings.weeklyTarget,
			daysLeft: Math.max(0, 4 - weekday),
		});
	}

	// Eight or more sent in the last 30 days with not one reply: the CV is the likely gap.
	const since = addDays(now, -30).getTime();
	const recent = apps.filter((app) => (lastEvent(app, "applied")?.getTime() ?? 0) >= since);
	const answered = recent.some((app) => lastEvent(app, "interview") || lastEvent(app, "offer"));
	if (recent.length >= 8 && !answered) notes.push({ kind: "no-replies", applied: recent.length });

	return notes;
}
