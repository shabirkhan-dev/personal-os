import type { HomeHero } from "@/modules/home/lib/module-home";
import { sessionsOnDay } from "../lib/training-math";
import { trainingRoutes } from "../navigation";
import { useTrainingToday } from "./use-training";

/** "Training · Hybrid Athlete week 3 / 3 of 5 sessions", or "Training · this week". */
export function useTrainingHero(): HomeHero {
	const { data, count, active } = useTrainingToday();
	if (!data.settings.setUp) {
		const total = data.sessions.length;
		return {
			label: "Training · getting started",
			value: String(total),
			faint: total === 1 ? " session yet" : " sessions yet",
		};
	}
	return {
		label:
			active && !active.finished && !active.upcoming
				? `Training · ${active.program.title} week ${active.week}`
				: "Training · this week",
		value: String(count.done),
		faint: ` of ${count.goal} sessions`,
		onLabelPress: trainingRoutes.week,
	};
}

/** The Overview line for Training. */
export function useWorkoutStatus(): string {
	const { data, template, slot, today, count } = useTrainingToday();
	if (!data.settings.setUp) return "Pick what you train";
	if (sessionsOnDay(data.sessions, today).length > 0)
		return `Done today · ${count.done} of ${count.goal} this week`;
	if (template && slot) return `${template.title} today`;
	return `${count.done} of ${count.goal} sessions this week`;
}
