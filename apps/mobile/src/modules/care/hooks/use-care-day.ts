import { useMemo } from "react";
import type { DayEntry } from "@/modules/home/lib/module-day";
import { doneCount, stepsOn } from "../lib/care-math";
import { useCareToday } from "./use-care";

export type CareDay = {
	setUp: boolean;
	morning: { done: number; total: number; finished: boolean };
	night: { done: number; total: number; finished: boolean; minutes: number };
	entries: DayEntry[];
	streak: number;
};

/** Today's routines for Daily life; the night routine sits 45 minutes before bed. */
export function useCareDay(bedMinutes: number, wakeMinutes: number): CareDay {
	const { data, record, today, streak } = useCareToday();
	return useMemo(() => {
		const morning = stepsOn(data.steps, "morning", today);
		const night = stepsOn(data.steps, "night", today);
		const length = (list: typeof morning) =>
			Math.max(
				2,
				list.reduce((sum, step) => sum + step.minutes, 0),
			);
		const finished = record?.finished ?? [];
		const nightAt = bedMinutes - 45;
		return {
			setUp: data.settings.setUp,
			morning: {
				done: doneCount(morning, record),
				total: morning.length,
				finished: finished.includes("morning"),
			},
			night: {
				done: doneCount(night, record),
				total: night.length,
				finished: finished.includes("night"),
				minutes: nightAt,
			},
			entries: data.settings.setUp
				? [
						{
							id: "care-morning",
							minutes: wakeMinutes + 30,
							length: length(morning),
							title: "Morning skin",
							detail: `${length(morning)} min`,
							done: finished.includes("morning"),
						},
						{
							id: "care-night",
							minutes: nightAt,
							length: length(night),
							title: "Night routine",
							detail: `${length(night)} min`,
							done: finished.includes("night"),
						},
					]
				: [],
			streak,
		};
	}, [data, record, today, streak, bedMinutes, wakeMinutes]);
}
