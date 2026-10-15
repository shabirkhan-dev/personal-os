import { asArray, asNumber, asString, isRecord } from "@/lib/storage/parse";

/**
 * The forecast Fashion dresses for (Open-Meteo, in the place's own time zone), and the words for
 * it: "18° cool evening", "Overshirt off at noon".
 */

export type HourTemp = { time: string; temp: number };
export type DayForecast = { day: string; high: number; low: number; code: number };
export type Forecast = {
	fetchedAt: string;
	place: string;
	now: { temp: number; code: number };
	hours: HourTemp[];
	days: DayForecast[];
};

export const WEATHER_SOURCE = "Weather by Open-Meteo.com (CC BY 4.0)";

/** Reads Open-Meteo's `/v1/forecast` answer; null when it is not one. */
export function parseOpenMeteo(raw: unknown, place: string, now: Date): Forecast | null {
	if (!isRecord(raw) || !isRecord(raw.current) || !isRecord(raw.hourly) || !isRecord(raw.daily)) {
		return null;
	}
	const temp = asNumber(raw.current.temperature_2m, Number.NaN);
	if (Number.isNaN(temp)) return null;
	const hourTimes = asArray(raw.hourly.time, (value) => (typeof value === "string" ? value : null));
	const hourTemps = asArray(raw.hourly.temperature_2m, (value) =>
		typeof value === "number" ? value : null,
	);
	const days = asArray(raw.daily.time, (value) => (typeof value === "string" ? value : null));
	const highs = asArray(raw.daily.temperature_2m_max, (value) =>
		typeof value === "number" ? value : null,
	);
	const lows = asArray(raw.daily.temperature_2m_min, (value) =>
		typeof value === "number" ? value : null,
	);
	const codes = asArray(raw.daily.weather_code, (value) =>
		typeof value === "number" ? value : null,
	);
	return {
		fetchedAt: now.toISOString(),
		place,
		now: { temp, code: asNumber(raw.current.weather_code, 0) },
		hours: hourTimes.flatMap((time, index) => {
			const value = hourTemps[index];
			return value === undefined ? [] : [{ time, temp: value }];
		}),
		days: days.flatMap((day, index) => {
			const high = highs[index];
			const low = lows[index];
			return high === undefined || low === undefined
				? []
				: [{ day, high, low, code: codes[index] ?? 0 }];
		}),
	};
}

/** The cached forecast, read back from storage. */
export function parseForecast(raw: unknown): Forecast | null {
	if (!isRecord(raw) || !isRecord(raw.now)) return null;
	const temp = asNumber(raw.now.temp, Number.NaN);
	if (Number.isNaN(temp)) return null;
	return {
		fetchedAt: asString(raw.fetchedAt, new Date(0).toISOString()),
		place: asString(raw.place, ""),
		now: { temp, code: asNumber(raw.now.code, 0) },
		hours: asArray(raw.hours, (item) =>
			isRecord(item) && typeof item.time === "string" && typeof item.temp === "number"
				? { time: item.time, temp: item.temp }
				: null,
		),
		days: asArray(raw.days, (item) =>
			isRecord(item) &&
			typeof item.day === "string" &&
			typeof item.high === "number" &&
			typeof item.low === "number"
				? { day: item.day, high: item.high, low: item.low, code: asNumber(item.code, 0) }
				: null,
		),
	};
}

/** "cold", "chilly", "cool", "mild", "warm", "hot". */
export function feel(temp: number): string {
	if (temp < 5) return "cold";
	if (temp < 12) return "chilly";
	if (temp < 19) return "cool";
	if (temp < 25) return "mild";
	if (temp < 31) return "warm";
	return "hot";
}

export function partOfDay(date: Date): string {
	const hour = date.getHours();
	if (hour >= 5 && hour < 12) return "morning";
	if (hour < 17 && hour >= 12) return "afternoon";
	if (hour < 21 && hour >= 17) return "evening";
	return "night";
}

/** WMO weather code → one word. */
export function condition(code: number): string {
	if (code === 0) return "clear";
	if (code <= 3) return "cloudy";
	if (code === 45 || code === 48) return "foggy";
	if (code >= 51 && code <= 67) return "rainy";
	if (code >= 71 && code <= 77) return "snowy";
	if (code >= 80 && code <= 82) return "showers";
	if (code >= 95) return "stormy";
	return "cloudy";
}

export function isWet(code: number): boolean {
	return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
}

/** The temperature nearest to `hour` on `day`, from the hourly forecast. */
export function tempAt(forecast: Forecast, day: string, hour: number): number | null {
	const key = `${day}T${String(hour).padStart(2, "0")}:00`;
	return forecast.hours.find((item) => item.time === key)?.temp ?? null;
}

export type DayParts = { morning: number; noon: number; evening: number };

/** Morning (8:00), noon (13:00) and evening (19:00), falling back to the day's low and high. */
export function dayParts(forecast: Forecast, day: string): DayParts | null {
	const daily = forecast.days.find((item) => item.day === day);
	if (!daily) return null;
	return {
		morning: Math.round(tempAt(forecast, day, 8) ?? daily.low),
		noon: Math.round(tempAt(forecast, day, 13) ?? daily.high),
		evening: Math.round(tempAt(forecast, day, 19) ?? (daily.low + daily.high) / 2),
	};
}

/** A layer goes on below this. */
export const LAYER_BELOW = 17;
