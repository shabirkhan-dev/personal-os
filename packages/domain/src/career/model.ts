import { asArray, asBoolean, asNumber, asString, isRecord, oneOf } from "../parse";

/**
 * Career's documents. Each type is stored in its own collection of the record store and read
 * back through a `parse` function, so data from an older app version (or a damaged row) turns
 * into a valid value instead of crashing a screen.
 */

export const STAGES = ["saved", "applied", "interview", "offer", "closed"] as const;
export type Stage = (typeof STAGES)[number];

export const HALAL_STATUSES = ["clean", "flagged", "unsure"] as const;
export type HalalStatus = (typeof HALAL_STATUSES)[number];

/** The AI's read of what the company earns from; `confirmed` once the person has checked it. */
export type Halal = { status: HalalStatus; note: string; confirmed: boolean };

export type Contact = { name: string; role: string; email: string };

export const EVENT_KINDS = ["saved", "applied", "nudged", "interview", "offer", "closed"] as const;
export type CareerEventKind = (typeof EVENT_KINDS)[number];
export type CareerEvent = { at: string; kind: CareerEventKind; note: string };

export type Interview = { at: string; round: string; minutes: number; interviewers: number };

export type Application = {
	id: string;
	company: string;
	role: string;
	/** As written on the post: "Rs 450k–550k / mo". */
	pay: string;
	/** "Remote · UK hours". */
	where: string;
	/** Which CV went out: "Frontend · Oct". */
	cv: string;
	link: string;
	notes: string;
	stage: Stage;
	halal: Halal;
	contact: Contact | null;
	interview: Interview | null;
	/** When to nudge if there is no reply (ISO). */
	followUpAt: string | null;
	/** Oldest first. */
	events: CareerEvent[];
	createdAt: string;
};

export type PrepTopic = { id: string; title: string; detail: string; done: boolean };

/** Interview prep for one application; its id is the application id. */
export type Prep = { id: string; topics: PrepTopic[]; questions: string[]; createdAt: string };

/** A short work story the person can tell in about two minutes. */
export type Story = { id: string; title: string; summary: string; minutes: number };

export type Flashcard = {
	id: string;
	/** The application the cards were made for. */
	deckId: string;
	topic: string;
	tag: string;
	front: string;
	back: string;
	code: string;
	dueAt: string;
	/** Current spacing in minutes; 0 before the first review. */
	intervalMinutes: number;
	reps: number;
};

export type SkillDay = { title: string; detail: string };
export type SkillWeek = { title: string; goal: string; days: SkillDay[] };

/** The 30-minutes-a-day skill path. One per person, id "plan". */
export type SkillPlan = {
	id: "plan";
	title: string;
	/** Monday of week 1, "YYYY-MM-DD". */
	startedOn: string;
	weeks: SkillWeek[];
};

/** One plan day practised; id is "w{week}d{day}", `date` the day it was done ("YYYY-MM-DD"). */
export type SkillSession = {
	id: string;
	date: string;
	minutes: number;
	status: "done" | "partial";
	week: number;
	day: number;
};

/** Career preferences. One per person, id "settings". */
export type CareerSettings = {
	id: "settings";
	weeklyTarget: number;
	/** Cash the job hunt can live on; null until set. */
	cashOnHand: number | null;
	/** Monthly costs; null means "estimate from Finance". */
	monthlyCosts: number | null;
};

export const defaultSettings: CareerSettings = {
	id: "settings",
	weeklyTarget: 10,
	cashOnHand: null,
	monthlyCosts: null,
};

const text = (value: unknown, max = 2_000) => asString(value, "").slice(0, max);
const isoOrNull = (value: unknown) =>
	typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
const positiveOrNull = (value: unknown) =>
	typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;

function parseHalal(raw: unknown): Halal {
	if (!isRecord(raw)) return { status: "unsure", note: "", confirmed: false };
	return {
		status: oneOf(raw.status, HALAL_STATUSES, "unsure"),
		note: text(raw.note, 240),
		confirmed: asBoolean(raw.confirmed, false),
	};
}

function parseContact(raw: unknown): Contact | null {
	if (!isRecord(raw)) return null;
	const contact = {
		name: text(raw.name, 80),
		role: text(raw.role, 80),
		email: text(raw.email, 160),
	};
	return contact.name || contact.email ? contact : null;
}

function parseEvent(raw: unknown): CareerEvent | null {
	if (!isRecord(raw)) return null;
	const at = isoOrNull(raw.at);
	if (!at || !(EVENT_KINDS as readonly unknown[]).includes(raw.kind)) return null;
	return { at, kind: raw.kind as CareerEventKind, note: text(raw.note, 200) };
}

function parseInterview(raw: unknown): Interview | null {
	if (!isRecord(raw)) return null;
	const at = isoOrNull(raw.at);
	if (!at) return null;
	return {
		at,
		round: text(raw.round, 80),
		minutes: asNumber(raw.minutes, 45),
		interviewers: asNumber(raw.interviewers, 1),
	};
}

export function parseApplication(raw: unknown): Application | null {
	if (!isRecord(raw) || typeof raw.id !== "string") return null;
	const createdAt = isoOrNull(raw.createdAt);
	if (!createdAt) return null;
	return {
		id: raw.id,
		company: text(raw.company, 120),
		role: text(raw.role, 120),
		pay: text(raw.pay, 80),
		where: text(raw.where, 80),
		cv: text(raw.cv, 80),
		link: text(raw.link, 500),
		notes: text(raw.notes),
		stage: oneOf(raw.stage, STAGES, "saved"),
		halal: parseHalal(raw.halal),
		contact: parseContact(raw.contact),
		interview: parseInterview(raw.interview),
		followUpAt: isoOrNull(raw.followUpAt),
		events: asArray(raw.events, parseEvent),
		createdAt,
	};
}

export function parsePrep(raw: unknown): Prep | null {
	if (!isRecord(raw) || typeof raw.id !== "string") return null;
	return {
		id: raw.id,
		topics: asArray(raw.topics, (topic) =>
			isRecord(topic) && typeof topic.id === "string"
				? {
						id: topic.id,
						title: text(topic.title, 80),
						detail: text(topic.detail, 160),
						done: asBoolean(topic.done, false),
					}
				: null,
		),
		questions: asArray(raw.questions, (question) =>
			typeof question === "string" ? question.slice(0, 200) : null,
		),
		createdAt: isoOrNull(raw.createdAt) ?? new Date(0).toISOString(),
	};
}

export function parseStory(raw: unknown): Story | null {
	if (!isRecord(raw) || typeof raw.id !== "string") return null;
	const title = text(raw.title, 80);
	if (!title) return null;
	return { id: raw.id, title, summary: text(raw.summary, 200), minutes: asNumber(raw.minutes, 2) };
}

export function parseFlashcard(raw: unknown): Flashcard | null {
	if (!isRecord(raw) || typeof raw.id !== "string" || typeof raw.deckId !== "string") return null;
	const front = text(raw.front, 200);
	if (!front) return null;
	return {
		id: raw.id,
		deckId: raw.deckId,
		topic: text(raw.topic, 80),
		tag: text(raw.tag, 40),
		front,
		back: text(raw.back, 300),
		code: text(raw.code, 200),
		dueAt: isoOrNull(raw.dueAt) ?? new Date(0).toISOString(),
		intervalMinutes: Math.max(0, asNumber(raw.intervalMinutes, 0)),
		reps: Math.max(0, asNumber(raw.reps, 0)),
	};
}

function parseSkillDay(raw: unknown): SkillDay | null {
	if (!isRecord(raw)) return null;
	const title = text(raw.title, 60);
	return title ? { title, detail: text(raw.detail, 120) } : null;
}

export function parseSkillPlan(raw: unknown): SkillPlan | null {
	if (!isRecord(raw) || raw.id !== "plan") return null;
	const startedOn = asString(raw.startedOn, "");
	if (!/^\d{4}-\d{2}-\d{2}$/.test(startedOn)) return null;
	const weeks = asArray(raw.weeks, (week) =>
		isRecord(week)
			? {
					title: text(week.title, 60),
					goal: text(week.goal, 120),
					days: asArray(week.days, parseSkillDay),
				}
			: null,
	).filter((week) => week.days.length > 0);
	if (weeks.length === 0) return null;
	return { id: "plan", title: text(raw.title, 60) || "Skill path", startedOn, weeks };
}

export function parseSkillSession(raw: unknown): SkillSession | null {
	if (!isRecord(raw) || typeof raw.id !== "string") return null;
	const date = asString(raw.date, "");
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
	return {
		id: raw.id,
		date,
		minutes: Math.max(0, asNumber(raw.minutes, 0)),
		status: oneOf(raw.status, ["done", "partial"] as const, "partial"),
		week: Math.max(0, asNumber(raw.week, 0)),
		day: Math.max(0, asNumber(raw.day, 0)),
	};
}

export function parseSettings(raw: unknown): CareerSettings | null {
	if (!isRecord(raw) || raw.id !== "settings") return null;
	return {
		id: "settings",
		weeklyTarget: Math.min(50, Math.max(1, Math.round(asNumber(raw.weeklyTarget, 10)))),
		cashOnHand: positiveOrNull(raw.cashOnHand),
		monthlyCosts: positiveOrNull(raw.monthlyCosts),
	};
}

export const STAGE_LABELS: Record<Stage, string> = {
	saved: "Saved",
	applied: "Applied",
	interview: "Interview",
	offer: "Offer",
	closed: "Closed",
};
