import type { ColorTokens } from "@personal-os/tokens";
import { addDays, dayKey } from "../dates";
import { asString, isRecord, oneOf } from "../parse";

/**
 * One calendar for the whole app. Each module contributes items for a range of days (training
 * sessions and program weeks, interviews, bills); personal events are stored here
 * (`calendar-events`). Items are plain data; the screen decides where tapping one goes.
 */

export const SOURCES = ["training", "career", "finance", "personal"] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
	training: "Training",
	career: "Career",
	finance: "Money",
	personal: "Personal",
};

export const TONES = [
	"accentDefault",
	"statusSuccess",
	"statusCaution",
	"statusDanger",
	"statusViolet",
] as const;
export type Tone = (typeof TONES)[number] & keyof ColorTokens;

export const SOURCE_TONES: Record<Source, Tone> = {
	training: "statusDanger",
	career: "accentDefault",
	finance: "statusCaution",
	personal: "statusViolet",
};

/** Where tapping an item goes. */
export type ItemLink =
	| { kind: "training-plan"; template: string }
	| { kind: "training-session"; id: string }
	| { kind: "training-program"; id: string }
	| { kind: "career-application"; id: string }
	| { kind: "finance-bills" }
	| { kind: "event"; id: string };

export type CalendarItem = {
	id: string;
	source: Source;
	/** "YYYY-MM-DD"; a range ends on `endDate`. */
	date: string;
	endDate?: string;
	/** Minutes after midnight; absent for all-day items. */
	minutes?: number;
	title: string;
	detail: string;
	tone: Tone;
	done?: boolean;
	link: ItemLink;
};

export type CalendarEvent = {
	id: string;
	title: string;
	date: string;
	endDate: string | null;
	/** Minutes after midnight; null for all day. */
	start: number | null;
	end: number | null;
	note: string;
	tone: Tone;
	createdAt: string;
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const asDay = (value: unknown) => (typeof value === "string" && DAY.test(value) ? value : null);
const minuteOrNull = (value: unknown) =>
	typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 1440
		? Math.round(value)
		: null;

export function parseEvent(raw: unknown): CalendarEvent | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const title = asString(raw.title, "").trim().slice(0, 80);
	const date = asDay(raw.date);
	if (!id || !title || !date) return null;
	const endDate = asDay(raw.endDate);
	const start = minuteOrNull(raw.start);
	const end = start === null ? null : minuteOrNull(raw.end);
	return {
		id,
		title,
		date,
		endDate: endDate && endDate > date ? endDate : null,
		start,
		end: end !== null && start !== null && end > start ? end : null,
		note: asString(raw.note, "").slice(0, 500),
		tone: oneOf(raw.tone, TONES, "statusViolet"),
		createdAt: asString(raw.createdAt, new Date(0).toISOString()),
	};
}

// --- dates --------------------------------------------------------------------------------------

const at = (day: string) => new Date(`${day}T12:00:00`);

/** Every day from `from` to `to`, inclusive. */
export function daysBetween(from: string, to: string): string[] {
	const days: string[] = [];
	for (let day = at(from); dayKey(day) <= to; day = addDays(day, 1)) days.push(dayKey(day));
	return days;
}

/** The weeks (Monday first) covering a month, as day keys; days outside it fill the edges. */
export function monthGrid(year: number, month: number): string[][] {
	const first = new Date(year, month, 1, 12);
	const start = addDays(first, -((first.getDay() + 6) % 7));
	const last = new Date(year, month + 1, 0, 12);
	const weeks: string[][] = [];
	for (let day = start; day <= last || weeks.length === 0 || weeks.at(-1)?.length !== 7;) {
		const week: string[] = [];
		for (let index = 0; index < 7; index += 1) {
			week.push(dayKey(day));
			day = addDays(day, 1);
		}
		weeks.push(week);
		if (day > last) break;
	}
	return weeks;
}

/** Items on one day: single-day items on it and ranges covering it, timed ones first by time. */
export function itemsOn(items: readonly CalendarItem[], day: string): CalendarItem[] {
	return items
		.filter((item) => (item.endDate ? item.date <= day && day <= item.endDate : item.date === day))
		.sort(
			(a, b) =>
				Number(Boolean(b.endDate)) - Number(Boolean(a.endDate)) ||
				(a.minutes ?? -1) - (b.minutes ?? -1) ||
				a.title.localeCompare(b.title),
		);
}

// --- sources ------------------------------------------------------------------------------------

/** Personal events in a range, a multi-day one once as a range. */
export function eventItems(
	events: readonly CalendarEvent[],
	from: string,
	to: string,
): CalendarItem[] {
	const items: CalendarItem[] = [];
	for (const event of events) {
		if (event.date > to || (event.endDate ?? event.date) < from) continue;
		const item: CalendarItem = {
			id: `event-${event.id}`,
			source: "personal",
			date: event.date,
			title: event.title,
			detail: event.note,
			tone: event.tone,
			link: { kind: "event", id: event.id },
		};
		if (event.endDate) item.endDate = event.endDate;
		if (event.start !== null) item.minutes = event.start;
		items.push(item);
	}
	return items;
}

type BillLike = {
	id: string;
	name: string;
	amount: number;
	dueDay: number;
	paid: readonly string[];
	since: string | null;
};

/** Bills due in a range: the due day each month (the last day for short months), unless paid. */
export function billItems(
	bills: readonly BillLike[],
	from: string,
	to: string,
	money: (amount: number) => string,
): CalendarItem[] {
	const items: CalendarItem[] = [];
	const start = at(from);
	for (
		let month = new Date(start.getFullYear(), start.getMonth(), 1, 12);
		dayKey(month) <= to;
		month = new Date(month.getFullYear(), month.getMonth() + 1, 1, 12)
	) {
		const key = dayKey(month).slice(0, 7);
		const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
		for (const bill of bills) {
			if (bill.since && key < bill.since) continue;
			const date = `${key}-${String(Math.min(bill.dueDay, last)).padStart(2, "0")}`;
			if (date < from || date > to) continue;
			const paid = bill.paid.includes(key);
			items.push({
				id: `bill-${bill.id}-${key}`,
				source: "finance",
				date,
				title: `${bill.name} due`,
				detail: paid ? `Paid · ${money(bill.amount)}` : money(bill.amount),
				tone: SOURCE_TONES.finance,
				done: paid,
				link: { kind: "finance-bills" },
			});
		}
	}
	return items;
}

type ApplicationLike = {
	id: string;
	company: string;
	role: string;
	stage: string;
	interview: { at: string; round: string; minutes: number } | null;
	followUpAt: string | null;
};

/** Interviews (with their time) and follow-up reminders for open applications. */
export function careerItems(
	apps: readonly ApplicationLike[],
	from: string,
	to: string,
): CalendarItem[] {
	const items: CalendarItem[] = [];
	for (const app of apps) {
		if (app.stage === "closed") continue;
		if (app.interview) {
			const when = new Date(app.interview.at);
			const date = dayKey(when);
			if (date >= from && date <= to) {
				items.push({
					id: `interview-${app.id}`,
					source: "career",
					date,
					minutes: when.getHours() * 60 + when.getMinutes(),
					title: `Interview · ${app.company}`,
					detail: `${app.interview.round} · ${app.role} · ${app.interview.minutes} min`,
					tone: SOURCE_TONES.career,
					link: { kind: "career-application", id: app.id },
				});
			}
		}
		if (app.followUpAt) {
			const date = dayKey(new Date(app.followUpAt));
			if (date >= from && date <= to) {
				items.push({
					id: `follow-up-${app.id}`,
					source: "career",
					date,
					title: `Follow up · ${app.company}`,
					detail: app.role,
					tone: SOURCE_TONES.career,
					link: { kind: "career-application", id: app.id },
				});
			}
		}
	}
	return items;
}

/** "14:30" */
export function clockLabel(minutes: number): string {
	return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(Math.round(minutes % 60)).padStart(2, "0")}`;
}
