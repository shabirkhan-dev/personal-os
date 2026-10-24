import { useMemo } from "react";
import { useCollection } from "@/lib/db/collection";
import { formatMoney } from "@/lib/money";
import { useCareer } from "@/modules/career/hooks/use-career";
import { useFinance } from "@/modules/finance/hooks/use-finance";
import { useOnboardingStore } from "@/modules/onboarding/store/onboarding-store";
import { useTraining } from "@/modules/workout/hooks/use-training";
import { calendarEvents } from "../data/collections";
import {
	billItems,
	type CalendarItem,
	careerItems,
	eventItems,
	type Source,
} from "../lib/calendar-model";
import { trainingItems } from "../lib/training-items";

/**
 * Everything on the calendar between two days: training, career and money from their modules (only
 * the ones turned on), plus personal events.
 */
export function useCalendar(from: string, to: string) {
	const training = useTraining();
	const career = useCareer();
	const finance = useFinance();
	const eventList = useCollection(calendarEvents);
	const modules = useOnboardingStore((state) => state.modules);

	return useMemo(() => {
		const events = eventList.data ?? [];
		const sources: Source[] = [
			...(modules.includes("workout") ? (["training"] as const) : []),
			...(modules.includes("career") ? (["career"] as const) : []),
			...(modules.includes("finance") ? (["finance"] as const) : []),
			"personal",
		];
		const items: CalendarItem[] = [
			...(sources.includes("training") ? trainingItems(training, from, to) : []),
			...(sources.includes("career") ? careerItems(career.apps, from, to) : []),
			...(sources.includes("finance")
				? billItems(finance.bills, from, to, (amount) => formatMoney(amount))
				: []),
			...eventItems(events, from, to),
		];
		return {
			loading: training.loading || career.loading || finance.loading || eventList.isPending,
			items,
			events,
			sources,
		};
	}, [training, career, finance, eventList, modules, from, to]);
}
