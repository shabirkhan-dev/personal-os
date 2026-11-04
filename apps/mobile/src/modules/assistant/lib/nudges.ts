import type { AssistantSettings } from "@personal-os/domain/assistant";
import type { Application } from "@personal-os/domain/career";
import { type Bill, upcomingBills } from "@personal-os/domain/finance";
import { formatMoney } from "@/lib/money";

/**
 * When the assistant reaches out on its own, worked out on the phone from the person's records.
 * Each nudge is a notification; tapping it opens the assistant with `ask` already asked.
 */
export type Nudge = {
	/** Stable per nudge, so a reschedule replaces it instead of doubling it. */
	id: string;
	title: string;
	body: string;
	/** What the assistant is asked when the notification is tapped. */
	ask: string;
} & ({ at: Date } | { daily: { hour: number; minute: number } });

export const MORNING_BRIEF_ASK =
	"Give me my morning brief: what's on today, my money, anything due, and the one thing to focus on.";

const DAY_MS = 86_400_000;
/** Heads-ups look this far ahead; the next app open plans further. */
const HORIZON_DAYS = 3;

const at = (day: Date, hour: number, minute = 0) =>
	new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);

const clock = (date: Date) =>
	`${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

export function planNudges(input: {
	settings: AssistantSettings;
	bills: readonly Bill[];
	applications: readonly Application[];
	now: Date;
}): Nudge[] {
	const { settings, now } = input;
	if (!settings.nudges) return [];
	const nudges: Nudge[] = [
		{
			id: "brief",
			title: "Your morning brief",
			body: "Today, your money and anything due, in one answer.",
			ask: MORNING_BRIEF_ASK,
			daily: { hour: Math.floor(settings.briefAt / 60), minute: settings.briefAt % 60 },
		},
	];
	const until = now.getTime() + HORIZON_DAYS * DAY_MS;
	const upcoming = (when: Date) => when.getTime() > now.getTime() && when.getTime() <= until;

	// A bill: the evening before it is due (overdue ones are already on Finance's Home).
	for (const { bill, due, overdue } of upcomingBills(input.bills, now)) {
		if (overdue) continue;
		const when = at(new Date(due.getTime() - DAY_MS), 19);
		if (!upcoming(when)) continue;
		nudges.push({
			id: `bill-${bill.id}-${due.getFullYear()}-${due.getMonth()}`,
			at: when,
			title: `${bill.name} is due tomorrow`,
			body: `${formatMoney(bill.amount)}. Tap to pay it or move it.`,
			ask: `My ${bill.name} bill (${formatMoney(bill.amount)}) is due tomorrow. Pay it for me.`,
		});
	}

	for (const app of input.applications) {
		if (app.stage === "closed") continue;
		// An interview: the evening before, with an offer to prepare.
		if (app.interview) {
			const start = new Date(app.interview.at);
			const when = at(new Date(start.getTime() - DAY_MS), 20);
			if (upcoming(when)) {
				nudges.push({
					id: `interview-${app.id}-${app.interview.at}`,
					at: when,
					title: `Interview with ${app.company} tomorrow`,
					body: `${app.interview.round || "Interview"} at ${clock(start)}. Want a quick prep?`,
					ask: `I have my ${app.company} interview (${app.role}) tomorrow at ${clock(start)}. Help me prepare: what to review and questions to expect.`,
				});
			}
		}
		// A follow-up: 10:00 on the day it is due.
		if (app.followUpAt) {
			const due = new Date(app.followUpAt);
			const when = at(due, 10);
			if (upcoming(when)) {
				nudges.push({
					id: `follow-up-${app.id}-${app.followUpAt}`,
					at: when,
					title: `Follow up with ${app.company}`,
					body: `${app.role}. Tap for a short message you can send.`,
					ask: `Draft a short, polite follow-up for my ${app.company} application (${app.role}), then log it as sent once I say so.`,
				});
			}
		}
	}
	return nudges;
}

/** The path inside the app for a notification's `personalos://…` link; null for the Home. */
export function pathOf(url: unknown): string | null {
	if (typeof url !== "string" || !url.startsWith("personalos://")) return null;
	const path = url.slice("personalos://".length);
	return path && path !== "/" ? `/${path.replace(/^\/+/, "")}` : null;
}
