import type { PrayerStatus } from "./faith-model";
import type { PrayerId } from "./prayer-times";

/**
 * Reads what the person typed or said in the Faith ask bar, on the phone: "prayed fajr", "missed
 * maghrib", "isha late", "recited 15 min", "when is maghrib", "qibla". Anything else is a question
 * for the Faith AI.
 */

export type FaithScreen =
	| "qibla"
	| "tasbih"
	| "zakat"
	| "grow"
	| "recitation"
	| "insights"
	| "reminders";

export type FaithIntent =
	| { kind: "prayer"; prayer: PrayerId | null; status: PrayerStatus }
	| { kind: "recite"; minutes: number }
	| { kind: "when"; prayer: PrayerId | null }
	| { kind: "open"; screen: FaithScreen }
	| { kind: "question"; text: string };

const PRAYER_WORDS: readonly [RegExp, PrayerId][] = [
	[/\b(fajr|fajar|fajir|subh|morning prayer)\b/, "fajr"],
	[/\b(dhuhr|zuhr|zohr|duhr|zuhar|noon prayer)\b/, "dhuhr"],
	[/\b(asr|asar)\b/, "asr"],
	[/\b(maghrib|magrib|maghreb|evening prayer)\b/, "maghrib"],
	[/\b(isha|esha|ishaa|night prayer)\b/, "isha"],
];

function prayerIn(text: string): PrayerId | null {
	for (const [pattern, id] of PRAYER_WORDS) if (pattern.test(text)) return id;
	return null;
}

const SCREENS: readonly [RegExp, FaithScreen][] = [
	[/\b(qibla|qiblah|kaaba|direction)\b/, "qibla"],
	[/\b(tasbih|tasbeeh|dhikr|zikr)\b/, "tasbih"],
	[/\b(zakat|zakah)\b/, "zakat"],
	[/\b(insights?|recap|my week)\b/, "insights"],
	[/\b(reminders?|notifications?|alarm)\b/, "reminders"],
	[/\b(grow|challenge|lessons?|flashcards?)\b/, "grow"],
];

export function parseFaithLine(input: string): FaithIntent | null {
	const text = input
		.trim()
		.toLowerCase()
		.replace(/[’']/g, "");
	if (!text) return null;
	const prayer = prayerIn(text);
	const question = /\?$|^(what|why|how|who|which|can|is|are|does|do|should|tell me|explain)\b/.test(
		text,
	);

	if (
		/\b(when|what time|time for|time of|how long)\b/.test(text) &&
		(prayer || /\bprayer|namaz|salah|next\b/.test(text))
	) {
		return { kind: "when", prayer };
	}

	const minutes = /(\d{1,3})\s*(m|min|mins|minutes?)\b/.exec(text);
	if (/\b(recit|read|quran|tilawat)/.test(text) && minutes && !question) {
		return { kind: "recite", minutes: Math.min(180, Number(minutes[1])) };
	}

	if (!question) {
		const missed = /\b(missed|miss|skipped|qaza|qada|didnt pray|did not pray|couldnt pray)\b/.test(
			text,
		);
		const late = /\b(late|qaza later|after time)\b/.test(text);
		const prayed = /\b(prayed|pray|done|did|offered|read|namaz|salah|dua)\b/.test(text);
		if (prayer && (missed || late || prayed)) {
			return { kind: "prayer", prayer, status: missed ? "missed" : late ? "late" : "prayed" };
		}
		if (prayer && text.split(/\s+/).length <= 2)
			return { kind: "prayer", prayer, status: "prayed" };
		if (/^(prayed|i prayed|just prayed|done praying|prayer done)\b/.test(text)) {
			return { kind: "prayer", prayer: null, status: late ? "late" : "prayed" };
		}
		for (const [pattern, screen] of SCREENS) {
			if (pattern.test(text) && text.split(/\s+/).length <= 4) return { kind: "open", screen };
		}
		if (/^(recite|recitation|start reciting)$/.test(text))
			return { kind: "open", screen: "recitation" };
	}

	return { kind: "question", text: input.trim() };
}
