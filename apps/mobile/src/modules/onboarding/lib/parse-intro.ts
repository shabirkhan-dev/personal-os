import type { Birthday } from "./insights";
import type { Gender, GoalId, WorkStyle } from "./options";
import { goalOptions, MAX_GOALS } from "./options";

/**
 * Understands the "Just talk" introduction ("I'm Ayesha, 26. I'm 5 foot 4 and 58 kilos…") on
 * the phone, with no server: plain patterns for the eight things onboarding asks about.
 * Speech-to-text output is lower-case or capitalised, with digits or number words.
 */
export type IntroFacts = {
	name?: string;
	age?: number;
	heightCm?: number;
	weightKg?: number;
	heightUnit?: "cm" | "ft";
	weightUnit?: "kg" | "lb";
	/** As said, when it was said in pounds. */
	weightLb?: number;
	wakeMinutes?: number;
	bedMinutes?: number;
	workStyle?: WorkStyle;
	workStartMinutes?: number;
	workEndMinutes?: number;
	goals: GoalId[];
	gender?: Gender;
	/** Phrases to emphasise in the transcript, as they were heard. */
	highlights: string[];
};

const UNITS: Record<string, number> = {
	zero: 0,
	one: 1,
	two: 2,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	seven: 7,
	eight: 8,
	nine: 9,
	ten: 10,
	eleven: 11,
	twelve: 12,
	thirteen: 13,
	fourteen: 14,
	fifteen: 15,
	sixteen: 16,
	seventeen: 17,
	eighteen: 18,
	nineteen: 19,
};
const TENS: Record<string, number> = {
	twenty: 20,
	thirty: 30,
	forty: 40,
	fifty: 50,
	sixty: 60,
	seventy: 70,
	eighty: 80,
	ninety: 90,
};

/** "twenty eight" → "28", "six thirty" → "6 30", "a hundred and seventy five" → "175". */
export function numberWordsToDigits(text: string): string {
	const tokens = text.split(/([^a-z]+)/i);
	const out: string[] = [];
	let i = 0;
	while (i < tokens.length) {
		const word = tokens[i]?.toLowerCase() ?? "";
		if (word in UNITS || word in TENS) {
			let value = UNITS[word] ?? TENS[word] ?? 0;
			let j = i + 1;
			// "twenty eight" / "twenty-eight"
			if (word in TENS) {
				const next = tokens[j + 1]?.toLowerCase() ?? "";
				if (/^(\s+|-)$/.test(tokens[j] ?? "") && next in UNITS && (UNITS[next] ?? 10) < 10) {
					value += UNITS[next] ?? 0;
					j += 2;
				}
			}
			out.push(String(value));
			i = j;
			continue;
		}
		out.push(tokens[i] ?? "");
		i += 1;
	}
	return out
		.join("")
		.replace(/\b(?:a|one)\s+hundred(?:\s+and)?\s+(\d{1,2})\b/gi, (_, rest: string) =>
			String(100 + Number(rest)),
		)
		.replace(/\b(\d)\s+hundred(?:\s+and)?\s+(\d{1,2})\b/gi, (_, h: string, rest: string) =>
			String(Number(h) * 100 + Number(rest)),
		);
}

const NOT_NAMES = new Set([
	"a",
	"an",
	"the",
	"from",
	"at",
	"about",
	"around",
	"not",
	"so",
	"also",
	"very",
	"really",
	"just",
	"here",
	"going",
	"trying",
	"working",
	"looking",
	"hoping",
	"living",
	"based",
	"currently",
	"in",
	"into",
	"on",
	"and",
	"male",
	"female",
	"man",
	"woman",
	"guy",
	"girl",
	"student",
	"engineer",
	"doctor",
	"developer",
	"designer",
	"teacher",
	"married",
	"single",
	"tired",
	"busy",
	"ok",
	"okay",
	"good",
	"fine",
	"new",
	"kind",
	"pretty",
	"quite",
	"usually",
	"always",
	"feeling",
	"years",
	"up",
	"awake",
	"out",
	"off",
	"with",
	"still",
	"sure",
	"sorry",
	"able",
	"my",
	"planning",
	"gonna",
	"want",
	"wanna",
	"hybrid",
	"remote",
	"sleeping",
	"waking",
	"learning",
	"studying",
	"single",
]);

function capitalise(word: string): string {
	return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function clockMinutes(
	hour: number,
	minute: number,
	meridiem: string | undefined,
	evening: boolean,
) {
	let h = hour % 24;
	const m = meridiem?.toLowerCase().replace(/\./g, "");
	if (m === "pm" && h < 12) h += 12;
	else if (m === "am" && h === 12) h = 0;
	else if (!m && evening && h >= 6 && h < 12) h += 12;
	else if (!m && evening && h === 12) h = 0;
	return (h * 60 + minute) % (24 * 60);
}

const TIME = String.raw`(\d{1,2})(?:[:.\s](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?`;

const GOAL_PATTERNS: { goal: GoalId; pattern: RegExp }[] = [
	{
		goal: "lose-weight",
		pattern:
			/\b(?:lose|losing|cut|drop)\s+(?:some\s+)?(?:weight|fat|kilos|pounds)|\bweight\s+loss|\bget\s+(?:fit|lean|slim)/i,
	},
	{
		goal: "build-muscle",
		pattern: /\b(?:build|gain|put\s+on)\s+(?:some\s+)?muscle|\bget\s+(?:stronger|bigger)|\bbulk/i,
	},
	{
		goal: "save-money",
		pattern: /\bsav(?:e|ing)\s+(?:more\s+)?money|\bsave\s+more|\bbudget|\bspend\s+less|\bsavings/i,
	},
	{ goal: "clear-skin", pattern: /\b(?:clear|better|glowing)\s+skin|\bskin\s*care|\bacne/i },
	{
		goal: "sleep-better",
		pattern: /\bsleep\s+better|\bbetter\s+sleep|\bmore\s+sleep|\bsleep\s+more/i,
	},
	{
		goal: "eat-healthy",
		pattern:
			/\beat(?:ing)?\s+(?:more\s+)?health(?:y|ier)|\bhealthy\s+(?:food|diet|eating)|\beat\s+better|\bdiet/i,
	},
	{ goal: "stay-organized", pattern: /\b(?:get|stay|be|more)\s+organi[sz]ed|\bproductiv/i },
	{
		goal: "less-stress",
		pattern:
			/\b(?:less|reduce|lower|manage)\s+(?:my\s+)?stress|\bstress\s+less|\banxiety|\bcalmer/i,
	},
];

/** Reads the facts out of what was said. Missing facts stay undefined. */
export function parseIntro(raw: string): IntroFacts {
	const text = numberWordsToDigits(raw);
	const facts: IntroFacts = { goals: [], highlights: [] };
	const mark = (phrase: string | undefined) => {
		const value = phrase?.trim();
		if (value && !facts.highlights.includes(value)) facts.highlights.push(value);
	};

	// Name: "my name is X", "I'm X", "this is X", "call me X".
	for (const match of text.matchAll(
		/\b(?:my\s+name\s+is|name's|i\s+am|i'm|im|this\s+is|call\s+me)\s+([a-z][a-z'-]{1,30})/gi,
	)) {
		const word = match[1] ?? "";
		if (!NOT_NAMES.has(word.toLowerCase())) {
			facts.name = capitalise(word);
			mark(match[1]);
			break;
		}
	}

	// Age: "28 years old", "aged 28", "age 28", or a number straight after the name ("I'm X, 28").
	const ageMatch =
		text.match(/\b(\d{1,2})\s*(?:years?\s*old|yrs?\s*old|y\/?o)\b/i) ??
		text.match(/\bage[d]?\s*(?:is\s*)?(\d{1,2})\b/i) ??
		(facts.name
			? text.match(
					new RegExp(
						String.raw`${facts.name}[,.\s]+(?:and\s+)?(?:i'?m\s+)?(\d{2})\b(?!\s*(?:cm|kg|kilo|pound|lb|feet|foot|ft|:))`,
						"i",
					),
				)
			: null);
	if (ageMatch) {
		const age = Number(ageMatch[1]);
		if (age >= 10 && age <= 99) {
			facts.age = age;
			mark(ageMatch[0].replace(new RegExp(`^${facts.name ?? "\\b"}[,.\\s]+`, "i"), ""));
		}
	}

	// Height: "5 foot 9", "5'9", "5 feet 9 inches", or "175 cm" / "I'm 175".
	const feet = text.match(
		/\b([4-7])\s*(?:foot|feet|ft|')\s*(?:and\s*)?(\d{1,2})?\s*(?:inches|inch|in|")?/i,
	);
	if (feet) {
		const inches = Number(feet[1]) * 12 + Number(feet[2] ?? 0);
		facts.heightCm = Math.round(inches * 2.54);
		facts.heightUnit = "ft";
		mark(feet[0]);
	} else {
		const cm =
			text.match(/\b(1\d{2}|2[0-2]\d)\s*(?:cm|centimet(?:er|re)s?)\b/i) ??
			text.match(
				/\b(?:i'?m|height\s*(?:is)?|tall)\s*(?:about\s*|around\s*)?(1[2-9]\d|2[0-2]\d)\b(?!\s*(?:kg|kilo|pound|lb))/i,
			);
		if (cm) {
			facts.heightCm = Number(cm[1]);
			facts.heightUnit = "cm";
			mark(cm[1]);
		}
	}

	// Weight: "72 kilos", "72 kg", "160 pounds".
	const kg = text.match(/\b(\d{2,3}(?:\.\d)?)\s*(?:kg|kgs|kilos?|kilograms?)\b/i);
	const lb = text.match(/\b(\d{2,3})\s*(?:lbs?|pounds?)\b/i);
	if (kg) {
		facts.weightKg = Math.round(Number(kg[1]));
		facts.weightUnit = "kg";
		mark(kg[0]);
	} else if (lb) {
		facts.weightLb = Number(lb[1]);
		facts.weightKg = Math.round(facts.weightLb * 0.4536);
		facts.weightUnit = "lb";
		mark(lb[0]);
	}

	// Wake and sleep times.
	const wake = text.match(
		new RegExp(
			String.raw`\b(?:wake\s*up|wake|get\s+up|up)\s*(?:at|around|by|about)?\s*${TIME}`,
			"i",
		),
	);
	if (wake) {
		facts.wakeMinutes = clockMinutes(Number(wake[1]), Number(wake[2] ?? 0), wake[3], false);
		mark(wake[0].replace(/^.*?(\d)/, "$1"));
	}
	const sleep = text.match(
		new RegExp(
			String.raw`\b(?:sleep|go\s+to\s+(?:bed|sleep)|bed(?:time)?|asleep)\s*(?:is\s*)?(?:at|around|by|about)?\s*${TIME}`,
			"i",
		),
	);
	if (sleep) {
		facts.bedMinutes = clockMinutes(Number(sleep[1]), Number(sleep[2] ?? 0), sleep[3], true);
		mark(sleep[0].replace(/^.*?(\d)/, "$1"));
	}

	// Work style and hours.
	const style = text.match(
		/\b(hybrid|remote(?:ly)?|from\s+home|wfh|(?:in\s+(?:the\s+)?|at\s+(?:the\s+)?)?office)\b/i,
	);
	if (style) {
		const word = (style[1] ?? "").toLowerCase();
		facts.workStyle = word.startsWith("hybrid")
			? "hybrid"
			: word.includes("office")
				? "office"
				: "remote";
		mark(style[1]);
	}
	const hours = text.match(
		new RegExp(String.raw`\b${TIME}\s*(?:to|till|until|-|–)\s*${TIME}`, "i"),
	);
	const workContext = /\b(work|job|office|shift)\b/i.test(text);
	if (hours && workContext) {
		const start = clockMinutes(Number(hours[1]), Number(hours[2] ?? 0), hours[3], false);
		let end = clockMinutes(Number(hours[4]), Number(hours[5] ?? 0), hours[6], false);
		if (!hours[6] && end <= start) end = (end + 12 * 60) % (24 * 60);
		if (start !== facts.wakeMinutes && end !== start) {
			facts.workStartMinutes = start;
			facts.workEndMinutes = end;
			mark(hours[0]);
		}
	}

	// Goals, in the order they were said.
	const found = GOAL_PATTERNS.map(({ goal, pattern }) => ({ goal, match: text.match(pattern) }))
		.filter((item): item is { goal: GoalId; match: RegExpMatchArray } => item.match !== null)
		.sort((a, b) => (a.match.index ?? 0) - (b.match.index ?? 0));
	for (const { goal, match } of found) {
		if (facts.goals.length >= MAX_GOALS) break;
		if (!facts.goals.includes(goal)) {
			facts.goals.push(goal);
			mark(match[0]);
		}
	}

	// Gender.
	const gender = text.match(/\b(male|man|guy|boy|female|woman|girl|lady|non[-\s]?binary)\b/i);
	if (gender) {
		const word = (gender[1] ?? "").toLowerCase();
		facts.gender = /^(female|woman|girl|lady)$/.test(word)
			? "female"
			: word.startsWith("non")
				? "other"
				: "male";
		mark(gender[1]);
	}

	return facts;
}

export type IntroAnswers = Partial<{
	name: string;
	birthday: Birthday;
	heightCm: number;
	weightKg: number;
	heightUnit: "cm" | "ft";
	weightUnit: "kg" | "lb";
	wakeMinutes: number;
	bedMinutes: number;
	workStartMinutes: number;
	workEndMinutes: number;
	workStyle: WorkStyle;
	goals: GoalId[];
	gender: Gender;
}>;

/** The answers to apply; only facts that were heard. An age becomes a birthday already passed. */
export function introAnswers(facts: IntroFacts, today: Date = new Date()): IntroAnswers {
	const answers: IntroAnswers = {};
	if (facts.name) answers.name = facts.name;
	if (facts.age) answers.birthday = { day: 1, month: 1, year: today.getFullYear() - facts.age };
	if (facts.heightCm) answers.heightCm = facts.heightCm;
	if (facts.heightUnit) answers.heightUnit = facts.heightUnit;
	if (facts.weightKg) answers.weightKg = facts.weightKg;
	if (facts.weightUnit) answers.weightUnit = facts.weightUnit;
	if (facts.wakeMinutes !== undefined) answers.wakeMinutes = facts.wakeMinutes;
	if (facts.bedMinutes !== undefined) answers.bedMinutes = facts.bedMinutes;
	if (facts.workStartMinutes !== undefined) answers.workStartMinutes = facts.workStartMinutes;
	if (facts.workEndMinutes !== undefined) answers.workEndMinutes = facts.workEndMinutes;
	if (facts.workStyle) answers.workStyle = facts.workStyle;
	if (facts.goals.length > 0) answers.goals = facts.goals;
	if (facts.gender) answers.gender = facts.gender;
	return answers;
}

export type FactId = "name" | "age" | "body" | "day" | "work" | "goal" | "gender";

export type FactChip = { id: string; fact: FactId; label: string; value: string; known: boolean };

const pad = (n: number) => String(n).padStart(2, "0");
const clock = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
const hour12 = (minutes: number) => {
	const h = Math.floor(minutes / 60) % 12 || 12;
	const m = minutes % 60;
	return m ? `${h}:${pad(m)}` : String(h);
};
const styleLabel: Record<WorkStyle, string> = {
	office: "Office",
	remote: "Remote",
	hybrid: "Hybrid",
};
const genderLabel: Record<Gender, string> = { male: "Male", female: "Female", other: "Other" };

function height({ heightCm, heightUnit }: IntroFacts): string {
	if (!heightCm) return "";
	if (heightUnit !== "ft") return `${heightCm} cm`;
	const inches = Math.round(heightCm / 2.54);
	return `${Math.floor(inches / 12)}′${inches % 12}″`;
}

function weight({ weightKg, weightLb }: IntroFacts): string {
	if (weightLb) return `${weightLb} lb`;
	return weightKg ? `${weightKg} kg` : "";
}

/** The chips under the transcript: what was understood, then dashed "Tap to add" for the rest. */
export function introChips(facts: IntroFacts): FactChip[] {
	const chips: FactChip[] = [];
	const add = (fact: FactId, label: string, value: string | undefined, missing: string) =>
		chips.push(
			value
				? { id: fact, fact, label, value, known: true }
				: { id: fact, fact, label: "Tap to add", value: missing, known: false },
		);
	add("name", "Name", facts.name, "Name");
	add("age", "Age", facts.age ? `${facts.age} years` : undefined, "Age");
	const body = [height(facts), weight(facts)].filter(Boolean).join(" · ");
	add("body", "Body", body || undefined, "Height and weight");
	const day =
		facts.wakeMinutes !== undefined || facts.bedMinutes !== undefined
			? `${facts.wakeMinutes !== undefined ? clock(facts.wakeMinutes) : "?"} → ${facts.bedMinutes !== undefined ? clock(facts.bedMinutes) : "?"}`
			: undefined;
	add("day", "Day", day, "Wake and sleep");
	const hours =
		facts.workStartMinutes !== undefined && facts.workEndMinutes !== undefined
			? ` ${hour12(facts.workStartMinutes)}–${hour12(facts.workEndMinutes)}`
			: "";
	add(
		"work",
		"Work",
		facts.workStyle ? `${styleLabel[facts.workStyle]}${hours}` : hours.trim() || undefined,
		"Work",
	);
	if (facts.goals.length === 0) add("goal", "Goal", undefined, "Goals");
	for (const goal of facts.goals) {
		const label = goalOptions.find((option) => option.id === goal)?.label ?? goal;
		chips.push({ id: `goal-${goal}`, fact: "goal", label: "Goal", value: label, known: true });
	}
	add("gender", "Gender", facts.gender ? genderLabel[facts.gender] : undefined, "Gender");
	return chips;
}

export type TranscriptSpan = { text: string; fact?: boolean };

/** Splits the transcript so the phrases that were understood can be emphasised. */
export function highlightSpans(text: string, highlights: readonly string[]): TranscriptSpan[] {
	const ranges: [number, number][] = [];
	const lower = text.toLowerCase();
	for (const phrase of highlights) {
		const index = lower.indexOf(phrase.toLowerCase());
		if (index >= 0) ranges.push([index, index + phrase.length]);
	}
	ranges.sort((a, b) => a[0] - b[0]);
	const spans: TranscriptSpan[] = [];
	let cursor = 0;
	for (const [start, end] of ranges) {
		if (start < cursor) continue;
		if (start > cursor) spans.push({ text: text.slice(cursor, start) });
		spans.push({ text: text.slice(start, end), fact: true });
		cursor = end;
	}
	if (cursor < text.length) spans.push({ text: text.slice(cursor) });
	return spans;
}
