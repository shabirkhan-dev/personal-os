import { useMemo } from "react";
import { addDays, dayKey } from "@/lib/day";
import { useNow } from "@/lib/use-now";
import { type DayContext, looksFor } from "../lib/outfits";
import { dayParts, type Forecast, isWet } from "../lib/weather";
import { useFashion } from "./use-fashion";
import { useWeather } from "./use-weather";

export function contextFor(forecast: Forecast | null, date: Date, evening: boolean): DayContext {
	const day = dayKey(date);
	const daily = forecast?.days.find((item) => item.day === day);
	return {
		day,
		weather: forecast ? dayParts(forecast, day) : null,
		wet: daily ? isWet(daily.code) : false,
		evening,
	};
}

/** Monday to Sunday of the week `date` is in, as day contexts. */
export function weekContexts(forecast: Forecast | null, date: Date): DayContext[] {
	const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
	return Array.from({ length: 7 }, (_, step) => contextFor(forecast, addDays(monday, step), false));
}

/** Today's looks, the weather they were picked for and what was already worn today. */
export function useFashionToday() {
	const data = useFashion();
	const weather = useWeather();
	const now = useNow();

	const today = useMemo(() => {
		const context = contextFor(weather.forecast, now, now.getHours() >= 17);
		const looks = looksFor(data.pieces, data.wears, context, 3);
		return {
			context,
			looks,
			worn: data.wears.find((wear) => wear.id === context.day) ?? null,
		};
	}, [data.pieces, data.wears, weather.forecast, now]);

	return { data, weather, now, ...today };
}
