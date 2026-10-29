import type { Scheduled } from "../flashcards";
import { asArray, asBoolean, asNumber, asString, isRecord, oneOf } from "../parse";
import {
	type AsrSchool,
	DEFAULT_PRAYERS,
	METHODS,
	type MethodId,
	type Place,
	PRAYERS,
	type PrayerId,
} from "./prayer-times";

/**
 * Faith's documents. Each lives in its own record-store collection and is read back through a
 * `parse` function, so an older or damaged row becomes a valid value instead of a crash.
 */

export const PRAYER_STATUSES = ["prayed", "late", "missed"] as const;
export type PrayerStatus = (typeof PRAYER_STATUSES)[number];

/** One prayer on one day; the id is "YYYY-MM-DD:fajr" so logging twice replaces it. */
export type PrayerLog = {
	id: string;
	day: string;
	prayer: PrayerId;
	status: PrayerStatus;
	at: string;
};

export type TasbihPhrase = { id: string; label: string; arabic: string; target: number };

export type FaithSettings = {
	id: "settings";
	/** False until the person picks location or their own times. */
	setUp: boolean;
	prayers: PrayerId[];
	place: Place | null;
	method: MethodId;
	asr: AsrSchool;
	/** Minutes after midnight, per prayer, when the person set the times themselves. */
	manual: Partial<Record<PrayerId, number>>;
	/** Which prayers remind, and how many minutes before. */
	reminders: Partial<Record<PrayerId, boolean>>;
	reminderLead: number;
	/** Quiet the app's other notifications for 15 minutes from each prayer time. */
	silence: boolean;
	/** In their own words, passed to the Faith AI ("Shia Ismaili", "Hanafi"). */
	tradition: string;
	recitationMinutes: number;
	/** The Tasbih sequence, in order. */
	tasbih: TasbihPhrase[];
	/** Speak the ayah after showing it. */
	readAloud: boolean;
};

export const DEFAULT_TASBIH: readonly TasbihPhrase[] = [
	{ id: "ya-allah", label: "Ya Allah", arabic: "يَا اللهُ", target: 33 },
	{ id: "ya-ali", label: "Ya Ali", arabic: "يَا عَلِيُّ", target: 33 },
	{ id: "ya-muhammad", label: "Ya Muhammad", arabic: "يَا مُحَمَّدُ", target: 33 },
];

/** Phrases offered when editing the sequence. */
export const TASBIH_PHRASES: readonly TasbihPhrase[] = [
	...DEFAULT_TASBIH,
	{ id: "subhanallah", label: "SubhanAllah", arabic: "سُبْحَانَ اللهِ", target: 33 },
	{ id: "alhamdulillah", label: "Alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ", target: 33 },
	{ id: "allahu-akbar", label: "Allahu Akbar", arabic: "اللهُ أَكْبَرُ", target: 34 },
	{ id: "astaghfirullah", label: "Astaghfirullah", arabic: "أَسْتَغْفِرُ اللهَ", target: 100 },
];

export const TASBIH_TARGETS = [11, 33, 99] as const;

export function defaultSettings(): FaithSettings {
	return {
		id: "settings",
		setUp: false,
		prayers: [...DEFAULT_PRAYERS],
		place: null,
		method: "karachi",
		asr: "standard",
		manual: {},
		reminders: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
		reminderLead: 10,
		silence: false,
		tradition: "",
		recitationMinutes: 10,
		tasbih: [...DEFAULT_TASBIH],
		readAloud: false,
	};
}

/** Counts for one day, per phrase id; the id is the day. */
export type TasbihDay = { id: string; counts: Record<string, number> };

export type RecitationSession = { id: string; day: string; minutes: number; at: string };

export type ZakatProfile = {
	id: "zakat";
	gold: number;
	cash: number;
	savings: number;
	/** What the person owes that is due now; it comes off the total. */
	debts: number;
	/** Nisab in rupees, as the person checked it (it moves with the gold or silver price). */
	nisab: number;
	/** Share due, 0.025 by default; editable for other ways of giving. */
	rate: number;
	/** When their wealth first reached nisab (ISO date); a lunar year from here it is due. */
	hawlStart: string | null;
};

export function defaultZakat(): ZakatProfile {
	return {
		id: "zakat",
		gold: 0,
		cash: 0,
		savings: 0,
		debts: 0,
		nisab: 155_000,
		rate: 0.025,
		hawlStart: null,
	};
}

export type ZakatPayment = { id: string; to: string; note: string; amount: number; at: string };

export const RESOURCE_KINDS = ["note", "link", "audio", "pdf"] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export type Resource = {
	id: string;
	kind: ResourceKind;
	title: string;
	body: string;
	url: string;
	createdAt: string;
	updatedAt: string;
};

/** The current Grow challenge, e.g. Quran in 30 days; one per person, id "challenge". */
export type Challenge = {
	id: "challenge";
	title: string;
	detail: string;
	days: number;
	startedOn: string;
	/** Days ("YYYY-MM-DD") marked done. */
	done: string[];
};

/** Lessons done on one learning path; id is the path id. */
export type PathProgress = { id: string; done: string[] };

export const CARD_KINDS = ["word", "dua"] as const;
export type CardKind = (typeof CARD_KINDS)[number];

export type FaithCard = Scheduled & {
	id: string;
	kind: CardKind;
	/** Arabic on the front. */
	front: string;
	prompt: string;
	back: string;
	source: string;
};

// --- parsing ------------------------------------------------------------------------------------

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function asDay(value: unknown): string | null {
	return typeof value === "string" && DAY.test(value) ? value : null;
}

function asIso(value: unknown, fallback: string): string {
	return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

function asMinutes(value: unknown): Partial<Record<PrayerId, number>> {
	if (!isRecord(value)) return {};
	const out: Partial<Record<PrayerId, number>> = {};
	for (const id of PRAYERS) {
		const minute = value[id];
		if (typeof minute === "number" && Number.isInteger(minute) && minute >= 0 && minute < 1440) {
			out[id] = minute;
		}
	}
	return out;
}

function asPrayer(value: unknown): PrayerId | null {
	return typeof value === "string" && (PRAYERS as readonly string[]).includes(value)
		? (value as PrayerId)
		: null;
}

export function parsePrayerLog(raw: unknown): PrayerLog | null {
	if (!isRecord(raw)) return null;
	const day = asDay(raw.day);
	const prayer = asPrayer(raw.prayer);
	if (!day || !prayer) return null;
	return {
		id: `${day}:${prayer}`,
		day,
		prayer,
		status: oneOf(raw.status, PRAYER_STATUSES, "prayed"),
		at: asIso(raw.at, `${day}T12:00:00.000Z`),
	};
}

function parsePhrase(raw: unknown): TasbihPhrase | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const label = asString(raw.label, "").trim();
	if (!id || !label) return null;
	return {
		id,
		label,
		arabic: asString(raw.arabic, ""),
		target: Math.min(1000, Math.max(1, Math.round(asNumber(raw.target, 33)))),
	};
}

function parsePlace(raw: unknown): Place | null {
	if (!isRecord(raw)) return null;
	const latitude = asNumber(raw.latitude, Number.NaN);
	const longitude = asNumber(raw.longitude, Number.NaN);
	if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || Number.isNaN(latitude + longitude)) {
		return null;
	}
	return { latitude, longitude, name: asString(raw.name, "") };
}

export function parseSettings(raw: unknown): FaithSettings | null {
	if (!isRecord(raw)) return null;
	const base = defaultSettings();
	const prayers = asArray(raw.prayers, asPrayer);
	const tasbih = asArray(raw.tasbih, parsePhrase);
	const reminders: Partial<Record<PrayerId, boolean>> = { ...base.reminders };
	if (isRecord(raw.reminders)) {
		for (const id of PRAYERS) reminders[id] = asBoolean(raw.reminders[id], true);
	}
	return {
		id: "settings",
		setUp: asBoolean(raw.setUp, false),
		prayers: prayers.length > 0 ? PRAYERS.filter((id) => prayers.includes(id)) : base.prayers,
		place: parsePlace(raw.place),
		method: oneOf(raw.method, METHODS, base.method),
		asr: oneOf(raw.asr, ["standard", "hanafi"] as const, base.asr),
		manual: asMinutes(raw.manual),
		reminders,
		reminderLead: Math.min(60, Math.max(0, Math.round(asNumber(raw.reminderLead, 10)))),
		silence: asBoolean(raw.silence, false),
		tradition: asString(raw.tradition, "").slice(0, 80),
		recitationMinutes: Math.min(120, Math.max(1, Math.round(asNumber(raw.recitationMinutes, 10)))),
		tasbih: tasbih.length > 0 ? tasbih : base.tasbih,
		readAloud: asBoolean(raw.readAloud, false),
	};
}

export function parseTasbihDay(raw: unknown): TasbihDay | null {
	if (!isRecord(raw)) return null;
	const id = asDay(raw.id);
	if (!id) return null;
	const counts: Record<string, number> = {};
	if (isRecord(raw.counts)) {
		for (const [key, value] of Object.entries(raw.counts)) {
			if (typeof value === "number" && value >= 0) counts[key] = Math.round(value);
		}
	}
	return { id, counts };
}

export function parseRecitation(raw: unknown): RecitationSession | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const day = asDay(raw.day);
	if (!id || !day) return null;
	return {
		id,
		day,
		minutes: Math.max(0, asNumber(raw.minutes, 0)),
		at: asIso(raw.at, `${day}T12:00:00.000Z`),
	};
}

function money(value: unknown, fallback: number): number {
	return Math.max(0, asNumber(value, fallback));
}

export function parseZakat(raw: unknown): ZakatProfile | null {
	if (!isRecord(raw)) return null;
	const base = defaultZakat();
	return {
		id: "zakat",
		gold: money(raw.gold, 0),
		cash: money(raw.cash, 0),
		savings: money(raw.savings, 0),
		debts: money(raw.debts, 0),
		nisab: money(raw.nisab, base.nisab),
		rate: Math.min(1, Math.max(0, asNumber(raw.rate, base.rate))),
		hawlStart: asDay(raw.hawlStart),
	};
}

export function parsePayment(raw: unknown): ZakatPayment | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const amount = asNumber(raw.amount, 0);
	if (!id || amount <= 0) return null;
	return {
		id,
		to: asString(raw.to, "").trim() || "Someone in need",
		note: asString(raw.note, ""),
		amount,
		at: asIso(raw.at, new Date(0).toISOString()),
	};
}

export function parseResource(raw: unknown): Resource | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const title = asString(raw.title, "").trim();
	if (!id || !title) return null;
	const createdAt = asIso(raw.createdAt, new Date(0).toISOString());
	return {
		id,
		kind: oneOf(raw.kind, RESOURCE_KINDS, "note"),
		title,
		body: asString(raw.body, ""),
		url: asString(raw.url, ""),
		createdAt,
		updatedAt: asIso(raw.updatedAt, createdAt),
	};
}

export function parseChallenge(raw: unknown): Challenge | null {
	if (!isRecord(raw)) return null;
	const startedOn = asDay(raw.startedOn);
	if (!startedOn) return null;
	return {
		id: "challenge",
		title: asString(raw.title, "Challenge"),
		detail: asString(raw.detail, ""),
		days: Math.min(365, Math.max(1, Math.round(asNumber(raw.days, 30)))),
		startedOn,
		done: asArray(raw.done, asDay),
	};
}

export function parsePathProgress(raw: unknown): PathProgress | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	if (!id) return null;
	return { id, done: asArray(raw.done, (value) => (typeof value === "string" ? value : null)) };
}

export function parseCard(raw: unknown): FaithCard | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const front = asString(raw.front, "");
	const back = asString(raw.back, "");
	if (!id || !front || !back) return null;
	return {
		id,
		kind: oneOf(raw.kind, CARD_KINDS, "word"),
		front,
		prompt: asString(raw.prompt, ""),
		back,
		source: asString(raw.source, ""),
		dueAt: asIso(raw.dueAt, new Date(0).toISOString()),
		intervalMinutes: Math.max(0, asNumber(raw.intervalMinutes, 0)),
		reps: Math.max(0, Math.round(asNumber(raw.reps, 0))),
	};
}
