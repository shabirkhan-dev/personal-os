import type { HomeHero } from "@/modules/home/lib/module-home";
import { feel, partOfDay } from "../lib/weather";
import { useFashionToday } from "./use-fashion-today";

/** "Fashion · Gilgit today / 18° cool evening". */
export function useFashionHero(): HomeHero {
	const { weather, now, data } = useFashionToday();
	const forecast = weather.forecast;
	if (!forecast) {
		return {
			label: "Fashion · wardrobe",
			value: String(data.pieces.length),
			faint: data.pieces.length === 1 ? " piece" : " pieces",
		};
	}
	const temp = Math.round(forecast.now.temp);
	return {
		label: `Fashion · ${weather.place?.name || forecast.place || "today"} today`,
		value: `${temp}°`,
		faint: ` ${feel(temp)} ${partOfDay(now)}`,
	};
}

/** The Overview line for Fashion: today's look, or what is left to do. */
export function useFashionStatus(): string {
	const { data, looks, worn } = useFashionToday();
	if (data.pieces.length === 0) return "Build your capsule";
	if (worn) return `Wearing · ${worn.look || "today's look"}`;
	return looks[0] ? `Today · ${looks[0].name}` : "Add tops and bottoms for outfits";
}
