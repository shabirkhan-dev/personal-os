import { useMemo } from "react";
import { dayKey } from "@/lib/day";
import { useFinanceSummary } from "@/modules/finance";
import { type DayEntry, minutesOf } from "@/modules/home/lib/module-day";
import { runwayWeeks } from "../lib/career-math";
import { useCareer, useNow } from "./use-career";

export type CareerDay = {
	appliedToday: number;
	/** A working day's share of the weekly target. */
	dailyTarget: number;
	/** Interviews today, for the plan. */
	entries: DayEntry[];
	/** An interview in the next three days, for an evening prep block. */
	interviewSoon: { company: string; at: string } | null;
	runwayWeeks: number | null;
};

/** Today's career numbers for Daily life. */
export function useCareerDay(): CareerDay {
	const { apps, settings } = useCareer();
	const finance = useFinanceSummary();
	const now = useNow();
	return useMemo(() => {
		const today = dayKey(now);
		const appliedToday = apps.filter((app) =>
			app.events.some((event) => event.kind === "applied" && dayKey(new Date(event.at)) === today),
		).length;
		const upcoming = apps
			.flatMap((app) => (app.interview ? [{ app, at: new Date(app.interview.at) }] : []))
			.filter(({ at }) => at.getTime() >= now.getTime() - 3_600_000)
			.sort((a, b) => a.at.getTime() - b.at.getTime());
		const soon = upcoming.find(({ at }) => at.getTime() - now.getTime() < 3 * 86_400_000);
		return {
			appliedToday,
			dailyTarget: Math.max(1, Math.ceil(settings.weeklyTarget / 5)),
			entries: upcoming
				.filter(({ at }) => dayKey(at) === today)
				.map(({ app, at }) => ({
					id: `career-interview-${app.id}`,
					minutes: minutesOf(at),
					length: app.interview?.minutes ?? 45,
					title: `Interview · ${app.company}`,
					detail: `${app.interview?.minutes ?? 45} min`,
					done: at.getTime() < now.getTime(),
				})),
			interviewSoon: soon ? { company: soon.app.company, at: soon.at.toISOString() } : null,
			runwayWeeks: runwayWeeks(settings, finance.spentThisMonth, now),
		};
	}, [apps, settings, finance.spentThisMonth, now]);
}
