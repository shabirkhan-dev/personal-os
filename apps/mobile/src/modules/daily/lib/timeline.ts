import { type CalendarItem, itemsOn, type ItemLink } from "@/modules/calendar/lib/calendar-model";
import type { AgendaItem } from "./daily-math";
import type { PlanModule } from "./daily-model";

/** One row of the Today timeline: a plan block, or a bill or personal event from the calendar. */
export type TimelineItem = AgendaItem & {
	/** No time of its own: shown first, as "All day". */
	allDay: boolean;
	/** Set for calendar rows, which open the calendar rather than a module. */
	link: ItemLink | null;
};

/**
 * The plan blocks plus the calendar rows the plan doesn't already have. Interviews and training
 * come through the plan from their modules, so only bills and personal events are added.
 */
export function todayTimeline(
	agenda: readonly AgendaItem[],
	calendar: readonly CalendarItem[],
	today: string,
): TimelineItem[] {
	const extra: TimelineItem[] = itemsOn(calendar, today)
		.filter((item) => item.source === "finance" || item.source === "personal")
		.map((item) => ({
			id: `calendar-${item.id}`,
			minutes: item.minutes ?? 0,
			length: 0,
			title: item.title,
			detail: item.detail,
			module: (item.source === "finance" ? "finance" : "daily-life") satisfies PlanModule,
			done: item.done ?? false,
			allDay: item.minutes === undefined,
			link: item.link,
		}));
	const plan = agenda.map((item) => ({ ...item, allDay: false, link: null }));
	return [...extra, ...plan].sort(
		(a, b) =>
			Number(b.allDay) - Number(a.allDay) ||
			a.minutes - b.minutes ||
			a.title.localeCompare(b.title),
	);
}

/**
 * Splits the day at `minuteNow`: what is over (ended, or done) and what is still to come. All-day
 * rows stay with the day ahead until they are done.
 */
export function splitAtNow(
	items: readonly TimelineItem[],
	minuteNow: number,
): { earlier: TimelineItem[]; ahead: TimelineItem[] } {
	const over = (item: TimelineItem) =>
		item.allDay ? item.done : item.done || item.minutes + Math.max(item.length, 15) <= minuteNow;
	return { earlier: items.filter(over), ahead: items.filter((item) => !over(item)) };
}
