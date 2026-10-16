import { dayKey } from "@/lib/day";
import type { Place } from "@/lib/location/current-place";
import { readJson, writeJson } from "@/lib/storage/json-file";
import { parseCachedUv, parseUv, type UvDay } from "../lib/uv";

/** Today's highest UV from Open-Meteo (free, no key, called from the phone), saved for offline. */

const CACHE = "care-uv";
const TIMEOUT_MS = 10_000;

/** The saved reading, only if it is for today. */
export async function cachedUv(now = new Date()): Promise<UvDay | null> {
	const saved = parseCachedUv(await readJson(CACHE));
	return saved && saved.day === dayKey(now) ? saved : null;
}

export async function fetchUv(place: Place, now = new Date()): Promise<UvDay> {
	const params = new URLSearchParams({
		latitude: place.latitude.toFixed(3),
		longitude: place.longitude.toFixed(3),
		daily: "uv_index_max",
		timezone: "auto",
		forecast_days: "1",
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
	if (!response.ok) throw new Error(`UV answered ${response.status}`);
	const uv = parseUv(await response.json(), place.name, now);
	if (!uv) throw new Error("UV answer was not a forecast");
	writeJson(CACHE, uv).catch((error: unknown) => console.warn("[care] could not save UV", error));
	return uv;
}
