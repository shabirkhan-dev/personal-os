import { asArray, asBoolean, asNumber, asString, isRecord, oneOf } from "../parse";

/**
 * Care's documents: skin, hair, body, nails and teeth. Each type lives in its own record-store
 * collection and is read back through a `parse` function, so data from an older app version (or a
 * damaged row) becomes a valid value instead of crashing a screen.
 */

export const CONCERNS = [
	"dark-spots",
	"tan",
	"dryness",
	"pores",
	"fine-lines",
	"dandruff",
	"hair-density",
	"early-greys",
	"nails",
	"teeth",
	"body-odour",
] as const;
export type Concern = (typeof CONCERNS)[number];

export const CONCERN_LABELS: Record<Concern, string> = {
	"dark-spots": "Dark spots",
	tan: "Tan",
	dryness: "Dryness",
	pores: "Pores",
	"fine-lines": "Fine lines",
	dandruff: "Dandruff",
	"hair-density": "Hair density",
	"early-greys": "Early greys",
	nails: "Nails",
	teeth: "Teeth",
	"body-odour": "Body odour",
};

export const SKIN_TYPES = ["normal-combination", "sensitive", "oily", "dry"] as const;
export type SkinType = (typeof SKIN_TYPES)[number];

export const SKIN_LABELS: Record<SkinType, string> = {
	"normal-combination": "Normal to combination",
	sensitive: "Sensitive",
	oily: "Oily",
	dry: "Dry",
};

export const ROUTINES = ["morning", "night"] as const;
export type Routine = (typeof ROUTINES)[number];

export const AREAS = ["face", "hair", "body"] as const;
export type Area = (typeof AREAS)[number];

export const AREA_LABELS: Record<Area, string> = { face: "Face", hair: "Hair", body: "Body" };

/** One thing done in a routine: "Niacinamide serum · 3 drops". */
export type Step = {
	id: string;
	routine: Routine;
	area: Area;
	name: string;
	detail: string;
	/** The shelf product it uses, if any. */
	productId: string | null;
	minutes: number;
	/** Weekdays it happens (0 = Sunday); empty = every day. */
	days: number[];
	/** One word for the week strip: "Wash", "Oil", "Scrub". */
	short: string;
	order: number;
};

export type Product = {
	id: string;
	name: string;
	area: Area;
	/** A bundled photo ("catalog:cleanser") or a photo kept on the phone. */
	photo: string | null;
	/** "YYYY-MM-DD" the current one was opened. */
	openedOn: string;
	/** How long one lasts, in days; 0 for tools that last (a comb, a nail kit). */
	lastsDays: number;
	/** Rupees for a new one. */
	price: number;
};

/** A small daily habit outside the routines: floss, lotion, water. */
export type Habit = {
	id: string;
	name: string;
	detail: string;
	/** "water" reads Food's water log instead of a tick. */
	link: "water" | null;
	order: number;
};

/** What was done on a day; the id is the day. */
export type CareDay = {
	id: string;
	/** Step id → ISO time it was ticked. */
	steps: Record<string, string>;
	habits: string[];
	skipped: Routine[];
	/** Routines fully done that day, frozen when the last step was ticked, so editing a routine
	 * later never rewrites the streak. */
	finished: Routine[];
};

export const METRICS = [
	"face-dryness",
	"dark-spots",
	"pores",
	"tan",
	"fine-lines",
	"dandruff",
	"hair-fall",
	"greys",
	"nails",
] as const;
export type Metric = (typeof METRICS)[number];

export const METRIC_LABELS: Record<Metric, string> = {
	"face-dryness": "Face dryness",
	"dark-spots": "Dark spots",
	pores: "Pores",
	tan: "Tan",
	"fine-lines": "Fine lines",
	dandruff: "Dandruff",
	"hair-fall": "Hair fall",
	greys: "Greys",
	nails: "Nails",
};

/** A weekly mirror check: 1 (fine) to 5 (bad) per metric, with a few words. No photos. */
export type CheckIn = {
	id: string;
	ratings: Partial<Record<Metric, number>>;
	notes: Partial<Record<Metric, string>>;
	at: string;
};

export type CarePlace = { name: string; latitude: number; longitude: number };

export type CareSettings = {
	id: "settings";
	setUp: boolean;
	concerns: Concern[];
	skin: SkinType[];
	/** Minutes after midnight for the sunscreen reapply reminder. */
	reapplyAt: number;
	/** 0 = Sunday … 6 = Saturday. */
	checkInDay: number;
	nailDay: number;
	place: CarePlace | null;
};

// --- parsing ------------------------------------------------------------------------------------

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const asDay = (value: unknown) => (typeof value === "string" && DAY.test(value) ? value : null);
const weekday = (value: unknown) =>
	typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6 ? value : null;
const strings = (value: unknown) =>
	asArray(value, (item) => (typeof item === "string" ? item : null));

const routines = (value: unknown) =>
	strings(value).filter((item): item is Routine => (ROUTINES as readonly string[]).includes(item));

export function defaultSettings(): CareSettings {
	return {
		id: "settings",
		setUp: false,
		concerns: [],
		skin: ["normal-combination"],
		reapplyAt: 13 * 60,
		checkInDay: 0,
		nailDay: 0,
		place: null,
	};
}

export function parseSettings(raw: unknown): CareSettings | null {
	if (!isRecord(raw)) return null;
	const base = defaultSettings();
	const place = isRecord(raw.place) ? raw.place : null;
	const latitude = place ? asNumber(place.latitude, Number.NaN) : Number.NaN;
	const longitude = place ? asNumber(place.longitude, Number.NaN) : Number.NaN;
	return {
		id: "settings",
		setUp: asBoolean(raw.setUp, false),
		concerns: strings(raw.concerns).filter((item): item is Concern =>
			(CONCERNS as readonly string[]).includes(item),
		),
		skin: strings(raw.skin).filter((item): item is SkinType =>
			(SKIN_TYPES as readonly string[]).includes(item),
		),
		reapplyAt: Math.min(23 * 60, Math.max(0, Math.round(asNumber(raw.reapplyAt, base.reapplyAt)))),
		checkInDay: weekday(raw.checkInDay) ?? base.checkInDay,
		nailDay: weekday(raw.nailDay) ?? base.nailDay,
		place:
			place && Number.isFinite(latitude) && Number.isFinite(longitude)
				? { name: asString(place.name, ""), latitude, longitude }
				: null,
	};
}

export function parseStep(raw: unknown): Step | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const name = asString(raw.name, "").trim();
	if (!id || !name) return null;
	return {
		id,
		routine: oneOf(raw.routine, ROUTINES, "morning"),
		area: oneOf(raw.area, AREAS, "face"),
		name,
		detail: asString(raw.detail, ""),
		productId: typeof raw.productId === "string" && raw.productId ? raw.productId : null,
		minutes: Math.min(60, Math.max(0, Math.round(asNumber(raw.minutes, 1)))),
		days: asArray(raw.days, weekday),
		short: asString(raw.short, "").slice(0, 8),
		order: asNumber(raw.order, 0),
	};
}

export function parseProduct(raw: unknown): Product | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const name = asString(raw.name, "").trim();
	const openedOn = asDay(raw.openedOn);
	if (!id || !name || !openedOn) return null;
	const photo = asString(raw.photo, "");
	return {
		id,
		name,
		area: oneOf(raw.area, AREAS, "face"),
		photo: /^(catalog:|file:\/\/|https:\/\/)/.test(photo) ? photo : null,
		openedOn,
		lastsDays: Math.min(730, Math.max(0, Math.round(asNumber(raw.lastsDays, 0)))),
		price: Math.max(0, Math.round(asNumber(raw.price, 0))),
	};
}

export function parseHabit(raw: unknown): Habit | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const name = asString(raw.name, "").trim();
	if (!id || !name) return null;
	return {
		id,
		name,
		detail: asString(raw.detail, ""),
		link: raw.link === "water" ? "water" : null,
		order: asNumber(raw.order, 0),
	};
}

export function parseDay(raw: unknown): CareDay | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	if (!id) return null;
	const steps: Record<string, string> = {};
	if (isRecord(raw.steps)) {
		for (const [key, at] of Object.entries(raw.steps)) {
			if (typeof at === "string" && !Number.isNaN(Date.parse(at))) steps[key] = at;
		}
	}
	return {
		id,
		steps,
		habits: strings(raw.habits),
		skipped: routines(raw.skipped),
		finished: routines(raw.finished),
	};
}

export function parseCheckIn(raw: unknown): CheckIn | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	if (!id) return null;
	const ratings: Partial<Record<Metric, number>> = {};
	const notes: Partial<Record<Metric, string>> = {};
	const rawRatings = isRecord(raw.ratings) ? raw.ratings : {};
	const rawNotes = isRecord(raw.notes) ? raw.notes : {};
	for (const metric of METRICS) {
		const value = rawRatings[metric];
		if (typeof value === "number" && value >= 1 && value <= 5) ratings[metric] = Math.round(value);
		const note = rawNotes[metric];
		if (typeof note === "string" && note.trim()) notes[metric] = note.trim().slice(0, 80);
	}
	return {
		id,
		ratings,
		notes,
		at:
			typeof raw.at === "string" && !Number.isNaN(Date.parse(raw.at))
				? raw.at
				: `${id}T12:00:00.000Z`,
	};
}
