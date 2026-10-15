import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from "adhan";
import type { Place } from "@/lib/location/current-place";

export type { Place };

/**
 * Prayer times on the phone, from the person's location (adhan) or the times they typed. Nothing
 * here needs the network, so times, the next prayer and the Qibla work offline.
 */

export const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerId = (typeof PRAYERS)[number];

export const PRAYER_LABELS: Record<PrayerId, string> = {
	fajr: "Fajr",
	dhuhr: "Dhuhr",
	asr: "Asr",
	maghrib: "Maghrib",
	isha: "Isha",
};

/** Morning, evening and night, as in the Figma frames; the person can add Dhuhr and Asr. */
export const DEFAULT_PRAYERS: readonly PrayerId[] = ["fajr", "maghrib", "isha"];

export const METHODS = ["karachi", "tehran", "mwl", "umm-al-qura", "egyptian", "isna"] as const;
export type MethodId = (typeof METHODS)[number];

export const METHOD_LABELS: Record<MethodId, string> = {
	karachi: "Karachi",
	tehran: "Tehran",
	mwl: "Muslim World League",
	"umm-al-qura": "Umm al-Qura",
	egyptian: "Egyptian",
	isna: "North America",
};

export type AsrSchool = "standard" | "hanafi";

/** Everything the times depend on. `manual` wins over the calculation for the prayers it sets. */
export type TimesSource = {
	place: Place | null;
	method: MethodId;
	asr: AsrSchool;
	/** Minutes after midnight, per prayer. */
	manual: Partial<Record<PrayerId, number>>;
};

export type DayTimes = { prayers: Partial<Record<PrayerId, Date>>; sunrise: Date | null };

function parameters(method: MethodId, asr: AsrSchool) {
	const params = {
		karachi: CalculationMethod.Karachi,
		tehran: CalculationMethod.Tehran,
		mwl: CalculationMethod.MuslimWorldLeague,
		"umm-al-qura": CalculationMethod.UmmAlQura,
		egyptian: CalculationMethod.Egyptian,
		isna: CalculationMethod.NorthAmerica,
	}[method]();
	params.madhab = asr === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
	return params;
}

function atMinute(date: Date, minute: number): Date {
	const out = new Date(date);
	out.setHours(Math.floor(minute / 60), minute % 60, 0, 0);
	return out;
}

/** The day's times; a prayer is missing when there is neither a location nor a typed time. */
export function dayTimes(source: TimesSource, date: Date): DayTimes {
	const prayers: Partial<Record<PrayerId, Date>> = {};
	let sunrise: Date | null = null;
	if (source.place) {
		const day = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
		const times = new PrayerTimes(
			new Coordinates(source.place.latitude, source.place.longitude),
			day,
			parameters(source.method, source.asr),
		);
		for (const id of PRAYERS) prayers[id] = times[id];
		sunrise = times.sunrise;
	}
	for (const id of PRAYERS) {
		const minute = source.manual[id];
		if (minute !== undefined) prayers[id] = atMinute(date, minute);
	}
	return { prayers, sunrise };
}

export type Slot = { prayer: PrayerId; at: Date };

/** The chosen prayers that have a time, in order. */
export function slots(times: DayTimes, chosen: readonly PrayerId[]): Slot[] {
	return PRAYERS.filter((id) => chosen.includes(id))
		.flatMap((prayer) => {
			const at = times.prayers[prayer];
			return at ? [{ prayer, at }] : [];
		})
		.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** The next chosen prayer after `now`, looking into tomorrow when today's are done. */
export function nextPrayer(
	source: TimesSource,
	chosen: readonly PrayerId[],
	now: Date,
): Slot | null {
	const today = slots(dayTimes(source, now), chosen).find((slot) => slot.at > now);
	if (today) return today;
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	return slots(dayTimes(source, tomorrow), chosen)[0] ?? null;
}

/** The part of the day the Sky header shows. */
export type Phase = "fajr" | "day" | "maghrib" | "isha";

const MINUTE = 60_000;

export function phaseAt(times: DayTimes, now: Date): Phase {
	const { fajr, maghrib, isha } = times.prayers;
	const t = now.getTime();
	if (!fajr || !maghrib) {
		const hour = now.getHours();
		return hour < 5
			? "isha"
			: hour < 7
				? "fajr"
				: hour < 18
					? "day"
					: hour < 20
						? "maghrib"
						: "isha";
	}
	const dawnEnds = times.sunrise?.getTime() ?? fajr.getTime() + 80 * MINUTE;
	const nightStarts = isha?.getTime() ?? maghrib.getTime() + 80 * MINUTE;
	if (t < fajr.getTime()) return "isha";
	if (t < dawnEnds) return "fajr";
	if (t < maghrib.getTime()) return "day";
	if (t < nightStarts) return "maghrib";
	return "isha";
}

const KAABA = { latitude: 21.4225, longitude: 39.8262 };

/** Degrees clockwise from true north towards the Kaaba. */
export function qiblaBearing(place: Pick<Place, "latitude" | "longitude">): number {
	return Qibla(new Coordinates(place.latitude, place.longitude));
}

/** Great-circle distance to Makkah, in km. */
export function distanceToMakkah(place: Pick<Place, "latitude" | "longitude">): number {
	const rad = Math.PI / 180;
	const dLat = (KAABA.latitude - place.latitude) * rad;
	const dLng = (KAABA.longitude - place.longitude) * rad;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(place.latitude * rad) * Math.cos(KAABA.latitude * rad) * Math.sin(dLng / 2) ** 2;
	return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const POINTS = [
	"north",
	"north-northeast",
	"northeast",
	"east-northeast",
	"east",
	"east-southeast",
	"southeast",
	"south-southeast",
	"south",
	"south-southwest",
	"southwest",
	"west-southwest",
	"west",
	"west-northwest",
	"northwest",
	"north-northwest",
] as const;

/** 254 → "west-southwest". */
export function compassPoint(degrees: number): string {
	const index = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16;
	return POINTS[index] ?? "north";
}

/** Signed turn from `heading` to `target`, in -180…180 (positive = turn right). */
export function turnBetween(heading: number, target: number): number {
	return ((((target - heading) % 360) + 540) % 360) - 180;
}

/** "04:58", 24-hour like the Figma timeline. */
export function hhmm(date: Date): string {
	return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** "2h 10m", "45m", "now". */
export function untilLabel(ms: number): string {
	const minutes = Math.max(0, Math.round(ms / MINUTE));
	if (minutes < 1) return "now";
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest}m`;
	return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** "17:38" or "5:38 pm" → minutes after midnight; null when it isn't a time. */
export function parseClock(text: string): number | null {
	const match = /^\s*(\d{1,2})(?::|\.)?(\d{2})?\s*(am|pm)?\s*$/i.exec(text);
	if (!match) return null;
	let hour = Number(match[1]);
	const minute = match[2] ? Number(match[2]) : 0;
	const meridiem = match[3]?.toLowerCase();
	if (minute > 59 || hour > 23 || (meridiem && (hour < 1 || hour > 12))) return null;
	if (meridiem === "pm" && hour < 12) hour += 12;
	if (meridiem === "am" && hour === 12) hour = 0;
	return hour * 60 + minute;
}
