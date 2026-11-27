/**
 * The duas the Faith Moment card shows at waking, after eating and before sleep. Everything else
 * in Faith (challenges, flashcards, tasbih) is the person's own, written or imported.
 */

export type Moment = {
	id: "wake" | "eat" | "sleep";
	label: string;
	arabic: string;
	translation: string;
};

/** Well-known duas from the hadith collections (al-Bukhari; Abu Dawud for after eating). */
export const MOMENTS: Record<Moment["id"], Moment> = {
	wake: {
		id: "wake",
		label: "When you wake up",
		arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
		translation: "All praise is for Allah, who gave us life after sleep, and to Him is the return.",
	},
	eat: {
		id: "eat",
		label: "After eating",
		arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
		translation: "All praise is for Allah, who fed us, gave us drink and made us Muslims.",
	},
	sleep: {
		id: "sleep",
		label: "Before sleep",
		arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
		translation: "In Your name, O Allah, I die and I live.",
	},
};

/** A challenge the person sets themselves (or imports): a daily step for a number of days. */
export type ChallengeTemplate = { title: string; detail: string; days: number };
