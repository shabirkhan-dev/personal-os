import { defaultSettings as defaultFinanceSettings } from "@personal-os/domain/finance";
import { defaultSettings as defaultFoodSettings } from "@personal-os/domain/food";
import { useCollection } from "@/lib/db/collection";
import { useNow } from "@/lib/use-now";
import { careDays, careSteps } from "@/modules/care/data/collections";
import { dayLogs, sleepLogs } from "@/modules/daily/data/collections";
import { prayerLogs } from "@/modules/faith/data/collections";
import { financeEntries, financeSettings } from "@/modules/finance/data/collections";
import { foodSettings, meals, water } from "@/modules/food/data/collections";
import { trainingSessions } from "@/modules/workout/data/collections";
import { buildReview, lastSevenDays, type Review } from "../lib/review-math";

/** The last seven days across every module, read from the phone. */
export function useReview(): { review: Review; loading: boolean } {
	const now = useNow();
	const sources = {
		prayers: useCollection(prayerLogs),
		sessions: useCollection(trainingSessions),
		entries: useCollection(financeEntries),
		finance: useCollection(financeSettings),
		meals: useCollection(meals),
		water: useCollection(water),
		food: useCollection(foodSettings),
		sleep: useCollection(sleepLogs),
		care: useCollection(careDays),
		steps: useCollection(careSteps),
		minimum: useCollection(dayLogs),
	};
	const loading = Object.values(sources).some((source) => source.isPending);
	const money = sources.finance.data?.[0] ?? defaultFinanceSettings();
	const food = sources.food.data?.[0] ?? defaultFoodSettings();
	const review = buildReview({
		days: lastSevenDays(now),
		prayers: sources.prayers.data ?? [],
		sessions: sources.sessions.data ?? [],
		spending: sources.entries.data ?? [],
		monthBudget: money.setUp
			? Object.values(money.limits).reduce((sum, value) => sum + value, 0)
			: 0,
		meals: sources.meals.data ?? [],
		water: sources.water.data ?? [],
		waterGoalMl: food.setUp ? food.targets.waterMl : 0,
		sleep: sources.sleep.data ?? [],
		care: sources.care.data ?? [],
		hasCare: (sources.steps.data?.length ?? 0) > 0,
		minimum: sources.minimum.data ?? [],
	});
	return { review, loading };
}
