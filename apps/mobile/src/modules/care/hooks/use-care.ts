import { useEffect, useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { dayKey } from "@/lib/day";
import { useNow } from "@/lib/use-now";
import {
	careCheckIns,
	careDays,
	careHabits,
	careProducts,
	careSettings,
	careSteps,
} from "../data/collections";
import { migrateOldSkincare } from "../data/care-actions";
import { currentRoutine, latestCheckIn, streak } from "../lib/care-math";
import { defaultSettings } from "../lib/care-model";

let migration: Promise<unknown> | null = null;

/** Everything Care keeps on the phone, read through React Query from the record store. */
export function useCare() {
	const settingsList = useCollection(careSettings);
	const stepList = useCollection(careSteps);
	const productList = useCollection(careProducts);
	const habitList = useCollection(careHabits);
	const dayList = useCollection(careDays);
	const checkInList = useCollection(careCheckIns);

	useEffect(() => {
		migration ??= migrateOldSkincare().catch((error: unknown) =>
			console.error("[care] could not move the old skincare log", error),
		);
	}, []);

	return useMemo(() => {
		const queries = [settingsList, stepList, productList, habitList, dayList, checkInList];
		return {
			loading: queries.some((query) => query.isPending),
			error: queries.find((query) => query.error)?.error ?? null,
			settings: settingsList.data?.[0] ?? defaultSettings(),
			steps: [...(stepList.data ?? [])].sort((a, b) => a.order - b.order),
			products: [...(productList.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
			habits: [...(habitList.data ?? [])].sort((a, b) => a.order - b.order),
			days: [...(dayList.data ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
			checkIns: [...(checkInList.data ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
		};
	}, [settingsList, stepList, productList, habitList, dayList, checkInList]);
}

export type CareData = ReturnType<typeof useCare>;

/** Today's record, the routine for this time of day, the streak and the latest check-in. */
export function useCareToday() {
	const data = useCare();
	const now = useNow();
	const today = dayKey(now);
	const view = useMemo(
		() => ({
			record: data.days.find((day) => day.id === today) ?? null,
			routine: currentRoutine(now),
			streak: streak(data.days, now),
			latest: latestCheckIn(data.checkIns),
		}),
		// `today` changes when `now` crosses midnight.
		[data, today, now],
	);
	return { data, now, today, ...view };
}
