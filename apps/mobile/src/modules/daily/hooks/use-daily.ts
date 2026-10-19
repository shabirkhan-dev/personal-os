import { useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { dayKey } from "@/lib/day";
import { useNow } from "@/lib/use-now";
import { useCareDay } from "@/modules/care";
import { useCareerDay } from "@/modules/career";
import { useFaithDay } from "@/modules/faith";
import { useFoodDay } from "@/modules/food";
import { minutesOf } from "@/modules/home/lib/module-day";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { useWorkoutDay } from "@/modules/workout";
import { dailySettings, dayLogs, dayPlans, sleepLogs } from "../data/collections";
import { draftPlan, keptToday, rightNow, type Sources, streak, withDone } from "../lib/daily-math";
import { defaultSettings, emptyLog } from "../lib/daily-model";

/** Daily's own records, read through React Query from the record store. */
export function useDailyData() {
	const settingsList = useCollection(dailySettings);
	const logList = useCollection(dayLogs);
	const sleepList = useCollection(sleepLogs);
	const planList = useCollection(dayPlans);
	const wakeMinutes = useOnboardingStore((state) => state.wakeMinutes);
	const bedMinutes = useOnboardingStore((state) => state.bedMinutes);

	return useMemo(() => {
		const queries = [settingsList, logList, sleepList, planList];
		const fallback = {
			...defaultSettings(),
			wakeAt: wakeMinutes,
			bedAt: bedMinutes,
			windDownAt: Math.max(0, bedMinutes - 30),
		};
		return {
			loading: queries.some((query) => query.isPending),
			error: queries.find((query) => query.error)?.error ?? null,
			settings: settingsList.data?.[0] ?? fallback,
			logs: [...(logList.data ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
			sleep: [...(sleepList.data ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
			plans: planList.data ?? [],
		};
	}, [settingsList, logList, sleepList, planList, wakeMinutes, bedMinutes]);
}

/** What every module said about today, with modules that are off left out. */
export function useSources(bedAt: number, wakeAt: number): Sources & { extra: Extra } {
	const modules = useOnboardingStore((state) => state.modules);
	const faith = useFaithDay();
	const career = useCareerDay();
	const food = useFoodDay();
	const care = useCareDay(bedAt, wakeAt);
	const workout = useWorkoutDay();
	return useMemo(() => {
		const on = (id: (typeof modules)[number]) => modules.includes(id);
		return {
			modules,
			faith: on("faith") && faith.setUp ? faith : null,
			career: on("career") ? career : null,
			food: on("food") ? food : null,
			care: on("skincare") && care.setUp ? care : null,
			workout: on("workout") ? workout : null,
			extra: { faith, career, food, care, workout },
		};
	}, [modules, faith, career, food, care, workout]);
}

type Extra = {
	faith: ReturnType<typeof useFaithDay>;
	career: ReturnType<typeof useCareerDay>;
	food: ReturnType<typeof useFoodDay>;
	care: ReturnType<typeof useCareDay>;
	workout: ReturnType<typeof useWorkoutDay>;
};

/** Today for Daily life: the plan (saved or drafted), what's now, the minimum day and streak. */
export function useDailyToday() {
	const data = useDailyData();
	const now = useNow(30_000);
	const today = dayKey(now);
	const sources = useSources(data.settings.bedAt, data.settings.wakeAt);

	const view = useMemo(() => {
		const log = data.logs.find((item) => item.id === today) ?? null;
		const saved = data.plans.find((plan) => plan.id === today) ?? null;
		const blocks = saved?.blocks ?? draftPlan(sources, data.settings, now);
		const agenda = withDone(blocks, sources);
		const minimum = data.settings.minimum;
		const kept = keptToday(minimum, sources, log);
		const logs = [
			...data.logs.filter((item) => item.id !== today),
			{ ...(log ?? emptyLog(today)), kept, total: minimum.length },
		];
		return {
			log,
			saved,
			agenda,
			current: rightNow(agenda, minutesOf(now), log?.later ?? []),
			kept,
			total: minimum.length,
			streak: streak(logs, now),
		};
	}, [data, sources, now, today]);

	return { data, sources, now, today, ...view };
}
