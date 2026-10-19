import { useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { dayKey } from "@/lib/day";
import {
	challenges,
	faithCards,
	faithSettings,
	pathProgress,
	prayerLogs,
	recitations,
	resources,
	tasbihDays,
	zakatPayments,
	zakatProfiles,
} from "../data/collections";
import { defaultSettings, defaultZakat } from "../lib/faith-model";

/** Everything Faith keeps on the phone, read through React Query from the record store. */
export function useFaith() {
	const settingsList = useCollection(faithSettings);
	const logs = useCollection(prayerLogs);
	const tasbih = useCollection(tasbihDays);
	const sessions = useCollection(recitations);
	const zakat = useCollection(zakatProfiles);
	const payments = useCollection(zakatPayments);
	const resourceList = useCollection(resources);
	const challenge = useCollection(challenges);
	const progress = useCollection(pathProgress);
	const cards = useCollection(faithCards);

	return useMemo(() => {
		const queries = [
			settingsList,
			logs,
			tasbih,
			sessions,
			zakat,
			payments,
			resourceList,
			challenge,
			progress,
			cards,
		];
		return {
			loading: queries.some((query) => query.isPending),
			error: queries.find((query) => query.error)?.error ?? null,
			settings: settingsList.data?.[0] ?? defaultSettings(),
			logs: logs.data ?? [],
			tasbihDays: tasbih.data ?? [],
			sessions: sessions.data ?? [],
			zakat: zakat.data?.[0] ?? defaultZakat(),
			payments: [...(payments.data ?? [])].sort((a, b) => b.at.localeCompare(a.at)),
			resources: [...(resourceList.data ?? [])].sort((a, b) =>
				b.updatedAt.localeCompare(a.updatedAt),
			),
			challenge: challenge.data?.[0] ?? null,
			progress: progress.data ?? [],
			cards: cards.data ?? [],
		};
	}, [
		settingsList,
		logs,
		tasbih,
		sessions,
		zakat,
		payments,
		resourceList,
		challenge,
		progress,
		cards,
	]);
}

export type FaithData = ReturnType<typeof useFaith>;

export function tasbihToday(data: FaithData, now: Date) {
	return data.tasbihDays.find((day) => day.id === dayKey(now)) ?? null;
}

/** Where Faith found the person, for other modules that need a place (Fashion's weather). */
export function useFaithPlace() {
	const settings = useCollection(faithSettings);
	return settings.data?.[0]?.place ?? null;
}
