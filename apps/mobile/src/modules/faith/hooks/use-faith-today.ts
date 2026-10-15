import { useMemo } from "react";
import { useNow } from "@/lib/use-now";
import { missedToday, prayedCount, timesSource, todayRows } from "../lib/faith-math";
import { dayTimes, nextPrayer, phaseAt } from "../lib/prayer-times";
import { useFaith } from "./use-faith";

/** Today's prayers, the next one and the part of the day, refreshed every 30 seconds. */
export function useFaithToday() {
	const data = useFaith();
	const now = useNow(30_000);
	const { settings, logs } = data;

	const today = useMemo(() => {
		const source = timesSource(settings);
		const rows = settings.setUp ? todayRows(settings, logs, now) : [];
		return {
			rows,
			prayed: prayedCount(rows),
			missed: missedToday(rows),
			next: settings.setUp ? nextPrayer(source, settings.prayers, now) : null,
			phase: phaseAt(dayTimes(source, now), now),
		};
	}, [settings, logs, now]);

	return { data, now, ...today };
}
