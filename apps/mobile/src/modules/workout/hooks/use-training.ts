import { useEffect, useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { dayKey } from "@/lib/day";
import { useNow } from "@/lib/use-now";
import {
	trainingPlans,
	trainingSessions,
	trainingSettings,
	trainingSkills,
} from "../data/collections";
import { ensureWeek, migrateOldWorkout } from "../data/training-actions";
import { templateById } from "../lib/library";
import { weekCount, weekDays } from "../lib/training-math";
import { defaultSettings } from "../lib/training-model";

let migration: Promise<unknown> | null = null;

/** Everything Training keeps on the phone, read through React Query from the record store. */
export function useTraining() {
	const settingsList = useCollection(trainingSettings);
	const sessionList = useCollection(trainingSessions);
	const planList = useCollection(trainingPlans);
	const skillList = useCollection(trainingSkills);

	useEffect(() => {
		migration ??= migrateOldWorkout().catch((error: unknown) =>
			console.error("[training] could not move the old workout log", error),
		);
	}, []);

	return useMemo(() => {
		const queries = [settingsList, sessionList, planList, skillList];
		return {
			loading: queries.some((query) => query.isPending),
			settings: settingsList.data?.[0] ?? defaultSettings(),
			sessions: [...(sessionList.data ?? [])].sort((a, b) =>
				b.startedAt.localeCompare(a.startedAt),
			),
			plans: planList.data ?? [],
			skills: [...(skillList.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
		};
	}, [settingsList, sessionList, planList, skillList]);
}

export type TrainingData = ReturnType<typeof useTraining>;

/** This week: the program, today's slot and template, and sessions done against the goal. */
export function useTrainingToday() {
	const data = useTraining();
	const now = useNow();
	const today = dayKey(now);
	const view = useMemo(() => {
		const week = weekDays(now);
		const plan = data.plans.find((item) => item.id === week[0]) ?? null;
		const slot = plan?.slots.find((item) => item.day === today) ?? null;
		return {
			week,
			plan,
			slot,
			template: templateById(slot?.template),
			count: weekCount(plan, data.sessions, week),
		};
		// `today` changes when `now` crosses midnight.
	}, [data, today, now]);

	useEffect(() => {
		if (data.loading) return;
		ensureWeek(view.plan, data.settings, now)?.catch((error: unknown) =>
			console.error("[training] could not plan the week", error),
		);
	}, [data.loading, view.plan, data.settings, now]);

	return { data, now, today, ...view };
}
