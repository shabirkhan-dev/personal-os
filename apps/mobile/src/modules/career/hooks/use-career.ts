import { useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import {
	applications,
	careerSettings,
	flashcards,
	preps,
	skillPlans,
	skillSessions,
	stories,
} from "../data/collections";
import { type Application, defaultSettings, type Prep } from "../lib/career-model";

export { useNow } from "@/lib/use-now";

/** Everything Career keeps on the phone, read through React Query from the record store. */
export function useCareer() {
	const apps = useCollection(applications);
	const prepList = useCollection(preps);
	const storyList = useCollection(stories);
	const cards = useCollection(flashcards);
	const plans = useCollection(skillPlans);
	const sessions = useCollection(skillSessions);
	const settingsList = useCollection(careerSettings);
	const name = useOnboardingStore((state) => state.name);

	return useMemo(() => {
		const queries = [apps, prepList, storyList, cards, plans, sessions, settingsList];
		return {
			loading: queries.some((query) => query.isPending),
			error: queries.find((query) => query.error)?.error ?? null,
			apps: apps.data ?? [],
			preps: prepList.data ?? [],
			stories: storyList.data ?? [],
			cards: cards.data ?? [],
			plan: plans.data?.[0] ?? null,
			sessions: sessions.data ?? [],
			settings: settingsList.data?.[0] ?? defaultSettings,
			senderName: name.trim(),
		};
	}, [apps, prepList, storyList, cards, plans, sessions, settingsList, name]);
}

export type CareerData = ReturnType<typeof useCareer>;

export function findApp(data: CareerData, id: string): Application | null {
	return data.apps.find((app) => app.id === id) ?? null;
}

export function findPrep(data: CareerData, id: string): Prep | null {
	return data.preps.find((prep) => prep.id === id) ?? null;
}
