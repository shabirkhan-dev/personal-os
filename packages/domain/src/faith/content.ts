import type { CardKind } from "./model";

/**
 * Faith's built-in content: the duas the Moment card shows, the Grow paths and the starter
 * flashcards. Everything here is shared by most traditions; the person adds their own on top.
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

export type Lesson = { id: string; title: string; detail: string };
export type LearningPath = { id: string; title: string; summary: string; lessons: Lesson[] };

export const PATHS: readonly LearningPath[] = [
	{
		id: "salah",
		title: "Salah, step by step",
		summary: "From purity to praying with full attention",
		lessons: [
			{
				id: "purity",
				title: "Purity before prayer",
				detail: "Wudu, slowly, once a day this week.",
			},
			{
				id: "words",
				title: "The words, read slowly",
				detail: "Read each part aloud from your book.",
			},
			{ id: "meaning", title: "The meaning of each part", detail: "Write it in your own words." },
			{ id: "by-heart", title: "The words by heart", detail: "One part a day until it flows." },
			{ id: "attention", title: "Praying with attention", detail: "Pause after each part." },
			{ id: "on-time", title: "On time for a week", detail: "Log every prayer for seven days." },
			{ id: "together", title: "Pray with others", detail: "Once this week, in congregation." },
			{ id: "teach", title: "Teach it back", detail: "Explain one part to someone at home." },
		],
	},
	{
		id: "beliefs",
		title: "Beliefs foundations",
		summary: "One topic a week, with notes",
		lessons: [
			{ id: "tawhid", title: "Oneness of God", detail: "Tawhid, and what it asks of a day." },
			{ id: "prophets", title: "Prophethood", detail: "Why messengers, and what they brought." },
			{ id: "quran", title: "The Quran", detail: "How it was revealed and kept." },
			{
				id: "guidance",
				title: "Guidance after the Prophet",
				detail: "As your tradition teaches it.",
			},
			{ id: "hereafter", title: "The hereafter", detail: "Accountability and mercy." },
			{ id: "intellect", title: "Knowledge and intellect", detail: "Faith that asks and learns." },
		],
	},
	{
		id: "surahs",
		title: "Ten short surahs by heart",
		summary: "A few lines each week",
		lessons: [
			{ id: "1", title: "Al-Fatihah", detail: "1 · 7 ayahs" },
			{ id: "112", title: "Al-Ikhlas", detail: "112 · 4 ayahs" },
			{ id: "113", title: "Al-Falaq", detail: "113 · 5 ayahs" },
			{ id: "114", title: "An-Nas", detail: "114 · 6 ayahs" },
			{ id: "108", title: "Al-Kawthar", detail: "108 · 3 ayahs" },
			{ id: "103", title: "Al-Asr", detail: "103 · 3 ayahs" },
			{ id: "110", title: "An-Nasr", detail: "110 · 3 ayahs" },
			{ id: "109", title: "Al-Kafirun", detail: "109 · 6 ayahs" },
			{ id: "106", title: "Quraysh", detail: "106 · 4 ayahs" },
			{ id: "94", title: "Ash-Sharh", detail: "94 · 8 ayahs" },
		],
	},
];

export type StarterCard = {
	id: string;
	kind: CardKind;
	front: string;
	prompt: string;
	back: string;
	source: string;
};

/** Words from the ayahs on the Home card, and short duas, to start the deck. */
export const STARTER_CARDS: readonly StarterCard[] = [
	{
		id: "yusr",
		kind: "word",
		front: "يُسْرًا",
		prompt: "What does this word mean?",
		back: "Ease",
		source: "Ash-Sharh 94:5",
	},
	{
		id: "usr",
		kind: "word",
		front: "ٱلْعُسْرِ",
		prompt: "What does this word mean?",
		back: "Hardship",
		source: "Ash-Sharh 94:5",
	},
	{
		id: "sabr",
		kind: "word",
		front: "صَبْر",
		prompt: "What does this word mean?",
		back: "Patience",
		source: "Al-Baqarah 2:153",
	},
	{
		id: "shukr",
		kind: "word",
		front: "شُكْر",
		prompt: "What does this word mean?",
		back: "Gratitude",
		source: "Ibrahim 14:7",
	},
	{
		id: "dhikr",
		kind: "word",
		front: "ذِكْر",
		prompt: "What does this word mean?",
		back: "Remembrance",
		source: "Ar-Ra'd 13:28",
	},
	{
		id: "rahmah",
		kind: "word",
		front: "رَحْمَة",
		prompt: "What does this word mean?",
		back: "Mercy",
		source: "Az-Zumar 39:53",
	},
	{
		id: "tawakkul",
		kind: "word",
		front: "تَوَكُّل",
		prompt: "What does this word mean?",
		back: "Trust in Allah",
		source: "At-Talaq 65:3",
	},
	{
		id: "ilm",
		kind: "word",
		front: "عِلْم",
		prompt: "What does this word mean?",
		back: "Knowledge",
		source: "Taha 20:114",
	},
	{
		id: "dua-knowledge",
		kind: "dua",
		front: "رَّبِّ زِدۡنِي عِلۡمٗا",
		prompt: "What does this dua ask for?",
		back: "My Lord, increase me in knowledge.",
		source: "Taha 20:114",
	},
	{
		id: "dua-ease",
		kind: "dua",
		front: "رَبِّ ٱشۡرَحۡ لِي صَدۡرِي",
		prompt: "What does this dua ask for?",
		back: "My Lord, expand for me my chest (with assurance).",
		source: "Taha 20:25",
	},
];

export type ChallengeTemplate = { title: string; detail: string; days: number };

export const CHALLENGES: readonly ChallengeTemplate[] = [
	{ title: "Recite the Quran in 30 days", detail: "One juz a day", days: 30 },
	{ title: "Fajr on time for 21 days", detail: "Log Fajr every morning", days: 21 },
	{ title: "Tasbih after every prayer", detail: "One set after each prayer", days: 14 },
	{ title: "One new dua a week", detail: "Learn it, then use it", days: 28 },
];
