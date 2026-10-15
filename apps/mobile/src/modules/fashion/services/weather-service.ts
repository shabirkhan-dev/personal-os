import type { Place } from "@/lib/location/current-place";
import { readJson, writeJson } from "@/lib/storage/json-file";
import { type Forecast, parseForecast, parseOpenMeteo } from "../lib/weather";

/**
 * Today's and the week's weather from Open-Meteo (free, no key, called from the phone). The last
 * answer is kept on the phone, so the Home still dresses for the day offline.
 */

const CACHE = "fashion-weather";
const TIMEOUT_MS = 10_000;

export async function cachedForecast(): Promise<Forecast | null> {
	try {
		return parseForecast(await readJson(CACHE));
	} catch (error) {
		console.warn("[fashion] could not read the saved forecast", error);
		return null;
	}
}

export async function fetchForecast(place: Place, now = new Date()): Promise<Forecast> {
	const params = new URLSearchParams({
		latitude: place.latitude.toFixed(3),
		longitude: place.longitude.toFixed(3),
		current: "temperature_2m,weather_code",
		hourly: "temperature_2m",
		daily: "temperature_2m_max,temperature_2m_min,weather_code",
		timezone: "auto",
		forecast_days: "7",
	});
	// AbortSignal.timeout is not in every React Native runtime, so the timer is set by hand.
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	let response: Response;
	try {
		response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
			signal: controller.signal,
		});
	} finally {
		clearTimeout(timer);
	}
	if (!response.ok) throw new Error(`Weather answered ${response.status}`);
	const forecast = parseOpenMeteo(await response.json(), place.name, now);
	if (!forecast) throw new Error("Weather answer was not a forecast");
	writeJson(CACHE, forecast).catch((error: unknown) =>
		console.warn("[fashion] could not save the forecast", error),
	);
	return forecast;
}
