import { useEffect, useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { dayKey } from "@/lib/day";
import { useNow } from "@/lib/use-now";
import {
	trainingActivities,
	trainingExercises,
	trainingPlans,
	trainingPrograms,
	trainingProgress,
	trainingSessions,
	trainingSettings,
	trainingSkills,
} from "../data/collections";
import { ensureWeek, migrateOldWorkout } from "../data/training-actions";
import { setCustomExercises } from "../lib/exercise-guide";
import { setTemplateResolver, templateById } from "../lib/library";
import { BUILT_IN_PROGRAMS } from "../lib/programs/built-in";
import { programById, resolveTemplate, weekNumber } from "../lib/programs/engine";
import type { ProgramDef, Progress } from "../lib/programs/program-model";
import { weekCount, weekDays } from "../lib/training-math";
import { defaultSettings } from "../lib/training-model";

let migration: Promise<unknown> | null = null;

/** Everything Training keeps on the phone, read through React Query from the record store. */
export function useTraining() {
	const settingsList = useCollection(trainingSettings);
	const sessionList = useCollection(trainingSessions);
	const planList = useCollection(trainingPlans);
	const skillList = useCollection(trainingSkills);
	const programList = useCollection(trainingPrograms);
	const progressList = useCollection(trainingProgress);
	const activityList = useCollection(trainingActivities);
	const exerciseList = useCollection(trainingExercises);

	useEffect(() => {
		migration ??= migrateOldWorkout().catch((error: unknown) =>
			console.error("[training] could not move the old workout log", error),
		);
	}, []);

	const data = useMemo(() => {
		const queries = [
			settingsList,
			sessionList,
			planList,
			skillList,
			programList,
			progressList,
			activityList,
			exerciseList,
		];
		const activities = [...(activityList.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
		const exercises = exerciseList.data ?? [];
		setCustomExercises(exercises);
		const custom = [...(programList.data ?? [])].sort((a, b) =>
			(b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
		);
		const programs: ProgramDef[] = [...BUILT_IN_PROGRAMS, ...custom];
		const progress = new Map<string, Progress>(
			(progressList.data ?? []).map((item) => [item.id, item]),
		);
		const settings = settingsList.data?.[0] ?? defaultSettings();
		// Program sessions ("p:hybrid-athlete:3:push") are built from the programs and levels. Set
		// here, during render, so the screen reading this data resolves them right away.
		setTemplateResolver((id) => resolveTemplate(id, { programs, progress, settings, activities }));
		return {
			loading: queries.some((query) => query.isPending),
			error: queries.find((query) => query.error)?.error ?? null,
			settings,
			sessions: [...(sessionList.data ?? [])].sort((a, b) =>
				b.startedAt.localeCompare(a.startedAt),
			),
			plans: planList.data ?? [],
			skills: [...(skillList.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
			programs,
			customPrograms: custom,
			progress,
			activities,
			savedExercises: exercises,
		};
	}, [
		settingsList,
		sessionList,
		planList,
		skillList,
		programList,
		progressList,
		activityList,
		exerciseList,
	]);

	return data;
}

export type TrainingData = ReturnType<typeof useTraining>;

/** The program being followed, which week of it this is, and whether it has finished. */
export function useActiveProgram(data: TrainingData, now: Date) {
	return useMemo(() => {
		const active = data.settings.program;
		const program = programById(data.programs, active?.id);
		if (!active || !program) return null;
		const week = weekNumber(active.startedOn, dayKey(now));
		return {
			program,
			week,
			finished: week > program.weeks,
			/** Started late in a week: week 1 begins next Monday. */
			upcoming: week < 1,
			startedOn: active.startedOn,
		};
	}, [data.settings.program, data.programs, now]);
}

/** This week: the program, today's slot and template, and sessions done against the goal. */
export function useTrainingToday() {
	const data = useTraining();
	const now = useNow();
	const today = dayKey(now);
	const active = useActiveProgram(data, now);
	const view = useMemo(() => {
		const week = weekDays(now);
		const plan = data.plans.find((item) => item.id === week[0]) ?? null;
		const slot = plan?.slots.find((item) => item.day === today) ?? null;
		const context = {
			programs: data.programs,
			progress: data.progress,
			settings: data.settings,
			activities: data.activities,
		};
		const template =
			slot?.template?.startsWith("p:") || slot?.template?.startsWith("a:")
				? resolveTemplate(slot.template, context)
				: templateById(slot?.template);
		return {
			week,
			plan,
			slot,
			template,
			count: weekCount(plan, data.sessions, week),
		};
		// `today` changes when `now` crosses midnight.
	}, [data, today, now]);

	useEffect(() => {
		if (data.loading) return;
		ensureWeek(view.plan, data.settings, active?.program, now)?.catch((error: unknown) =>
			console.error("[training] could not plan the week", error),
		);
	}, [data.loading, view.plan, data.settings, active?.program, now]);

	return { data, now, today, active, ...view };
}
