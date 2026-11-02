import type { ListItem, Tone as CardTone } from "@personal-os/domain/assistant";
import {
	billItems,
	type CalendarEvent,
	type CalendarItem,
	careerItems,
	clockLabel,
	daysBetween,
	eventItems,
	parseEvent,
	SOURCE_TONES,
} from "@personal-os/domain/calendar";
import { parseApplication } from "@personal-os/domain/career";
import { dayKey, newId } from "@personal-os/domain/dates";
import { parseBill } from "@personal-os/domain/finance";
import * as z from "zod";

import { getRecord, listRecords, putRecord } from "../assistant.records";
import { localClock } from "../assistant.time";
import { defineTool, type ToolContext, ToolError } from "../assistant.tool";

const EVENTS = "calendar-events";
const rupees = (amount: number) => `Rs ${Math.round(amount).toLocaleString("en-US")}`;

const CARD_TONE: Record<CalendarItem["source"], CardTone> = {
	training: "danger",
	career: "accent",
	finance: "caution",
	personal: "neutral",
};

const dayLabel = (day: string) =>
	new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		timeZone: "UTC",
	});

/** "14:30" → minutes after midnight. */
function minutesOf(clock: string | undefined): number | null {
	if (!clock) return null;
	const [h, m] = clock.split(":").map(Number);
	return (h ?? 0) * 60 + (m ?? 0);
}

/** The person's calendar between two days: their events, bills due, interviews and follow-ups. */
async function itemsBetween(ctx: ToolContext, from: string, to: string) {
	const clock = localClock(ctx.now, ctx.context.timeZone);
	const [events, bills, apps] = await Promise.all([
		listRecords(ctx.db, ctx.userId, EVENTS, parseEvent),
		listRecords(ctx.db, ctx.userId, "finance-bills", parseBill),
		listRecords(ctx.db, ctx.userId, "career-applications", parseApplication),
	]);
	// Interview and follow-up times move to the person's clock, so their days are local days.
	const localApps = apps.map((app) =>
		Object.assign({}, app, {
			interview: app.interview
				? Object.assign({}, app.interview, { at: clock.shift(app.interview.at) })
				: null,
			followUpAt: app.followUpAt ? clock.shift(app.followUpAt) : null,
		}),
	);
	return [
		...eventItems(events, from, to),
		...billItems(bills, from, to, rupees),
		...careerItems(localApps, from, to),
	].toSorted((a, b) => a.date.localeCompare(b.date) || (a.minutes ?? -1) - (b.minutes ?? -1));
}

const calendarView = defineTool({
	name: "calendar_view",
	description:
		"What's on between two days (the next seven when omitted): their own events, bills due, interviews and application follow-ups, in order. Use it for 'what's my week', 'am I free Thursday', before adding an event that might clash.",
	input: z
		.object({
			from: z.iso.date().optional(),
			to: z.iso.date().optional(),
		})
		.strict(),
	effect: "read",
	label: () => "Checking your calendar",
	run: async (ctx, input) => {
		const today = dayKey(localClock(ctx.now, ctx.context.timeZone).now);
		const from = input.from ?? today;
		const to =
			input.to ??
			new Date(Date.parse(`${from}T12:00:00Z`) + 6 * 86_400_000).toISOString().slice(0, 10);
		if (daysBetween(from, to).length > 62)
			throw new ToolError("Ask for two months or less at a time.");
		const items = await itemsBetween(ctx, from, to);
		return {
			result: {
				from,
				to,
				items: items.map((item) => ({
					day: item.date,
					time: item.minutes !== undefined ? clockLabel(item.minutes) : undefined,
					title: item.title,
					detail: item.detail || undefined,
					kind: item.source,
					done: item.done || undefined,
					eventId: item.link.kind === "event" ? item.link.id : undefined,
				})),
			},
			cards: [
				{
					kind: "list",
					title: `${dayLabel(from)} – ${dayLabel(to)}`,
					empty: "Nothing on.",
					items: items.map((item): ListItem => ({
						id: item.id,
						title: item.title,
						subtitle: `${dayLabel(item.date)}${item.minutes !== undefined ? ` · ${clockLabel(item.minutes)}` : ""}${item.detail ? ` · ${item.detail}` : ""}`,
						tone: item.done ? "success" : CARD_TONE[item.source],
						value: item.done ? "Done" : undefined,
						link:
							item.link.kind === "career-application"
								? { screen: "career-application", id: item.link.id }
								: item.link.kind === "finance-bills"
									? { screen: "finance" }
									: { screen: "calendar" },
					})),
				},
			],
		};
	},
});

const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const addEvent = defineTool({
	name: "add_event",
	description:
		"Adds a personal event to their calendar: a title, a day (or a range of days), and optionally a start and end time in their own zone.",
	input: z
		.object({
			title: z.string().trim().min(1).max(80),
			date: z.iso.date(),
			endDate: z.iso.date().optional().describe("Last day, for something that spans days."),
			start: clock.optional().describe("'HH:MM'; all day when omitted."),
			end: clock.optional(),
			note: z.string().trim().max(200).default(""),
		})
		.strict(),
	effect: "write",
	label: (input) => `Adding ${input.title}`,
	describe: async (_ctx, input) => ({
		title: `Add "${input.title}"`,
		detail: `${dayLabel(input.date)}${input.endDate ? ` – ${dayLabel(input.endDate)}` : ""}${input.start ? ` · ${input.start}${input.end ? `–${input.end}` : ""}` : " · all day"}`,
	}),
	run: async (ctx, input) => {
		if (input.endDate && input.endDate < input.date)
			throw new ToolError("The end day is before the start day.");
		const event: CalendarEvent = {
			id: newId(),
			title: input.title,
			date: input.date,
			endDate: input.endDate && input.endDate !== input.date ? input.endDate : null,
			start: minutesOf(input.start),
			end: minutesOf(input.end),
			note: input.note,
			tone: SOURCE_TONES.personal,
			createdAt: ctx.now.toISOString(),
		};
		await putRecord(ctx.db, ctx.userId, EVENTS, event.id, event, ctx.now.getTime());
		return {
			result: { added: { id: event.id, title: event.title, date: event.date } },
			changed: [EVENTS],
			undo: [{ collection: EVENTS, id: event.id, previous: null }],
		};
	},
});

const deleteEvent = defineTool({
	name: "delete_event",
	description: "Deletes one of their own events by id (from calendar_view's eventId).",
	input: z.object({ id: z.string().min(1).max(64) }).strict(),
	effect: "risky",
	label: () => "Deleting the event",
	describe: async (ctx, input) => {
		const event = await getRecord(ctx.db, ctx.userId, EVENTS, input.id, parseEvent);
		if (!event) throw new ToolError("No event has that id.");
		return { title: `Delete "${event.title}"`, detail: dayLabel(event.date) };
	},
	run: async (ctx, input) => {
		const event = await getRecord(ctx.db, ctx.userId, EVENTS, input.id, parseEvent);
		if (!event) throw new ToolError("No event has that id. Find it with calendar_view.");
		await putRecord(ctx.db, ctx.userId, EVENTS, event.id, event, ctx.now.getTime(), true);
		return {
			result: { deleted: event.title },
			changed: [EVENTS],
			undo: [{ collection: EVENTS, id: event.id, previous: event }],
		};
	},
});

export const calendarTools = [calendarView, addEvent, deleteEvent];
