import {
	TEMPLATE_FORMAT,
	TEMPLATE_VERSION,
	type TemplateKind,
} from "@personal-os/domain/templates";
import type { IconName } from "@/components/icons";

/**
 * What each kind of template holds, written so any AI (ChatGPT, Claude, Gemini, a local model) can
 * make one: the fields and their allowed values, and a small example. Nothing ships with the app;
 * the person asks an AI with this prompt, then imports the file or pastes the reply.
 */

export type TemplateFormat = {
	kind: TemplateKind;
	label: string;
	icon: IconName;
	/** One line for the list: what you get. */
	what: string;
	/** An idea of what to ask for, shown as the placeholder. */
	ask: string;
	/** The fields of one item, in plain words, with allowed values. */
	fields: string;
	/** One or two example items in the exact shape. */
	example: unknown[];
};

const SLOTS = "breakfast, lunch, snack, dinner, bed";
const PATTERNS =
	"push, vertical-push, dip, pull, row, lever, squat, hinge, lunge, core, handstand, conditioning, mobility, run, boxing, sport, gym";
const EQUIPMENT = "pull-up-bar, dip-bars, rings, band, jump-rope, heavy-bag, gym";

export const TEMPLATE_FORMATS: readonly TemplateFormat[] = [
	{
		kind: "recipes",
		label: "Recipes",
		icon: "Food",
		what: "Dishes with ingredients, steps and macros, for Food and the meal plan.",
		ask: "10 high-protein desi dinners under 40 minutes",
		fields: `name; kind (a short label like "Desi · dinner"); slots (any of: ${SLOTS}); tags (any of: high-protein, bulk, desi, quick, cheap); minutes; serves; per serving: kcal, protein, carbs, fat (grams) and cost (in the person's currency); ingredients [{ name, amount }]; steps [{ text, minutes }]; note (optional); video (optional https link).`,
		example: [
			{
				name: "Chicken karahi",
				kind: "Desi · dinner",
				slots: ["dinner", "lunch"],
				tags: ["high-protein", "desi"],
				minutes: 35,
				serves: 2,
				kcal: 520,
				protein: 42,
				carbs: 16,
				fat: 30,
				cost: 450,
				ingredients: [
					{ name: "Chicken", amount: "500 g" },
					{ name: "Tomatoes", amount: "4" },
				],
				steps: [
					{ text: "Fry the chicken until golden.", minutes: 8 },
					{
						text: "Add tomatoes, ginger, garlic and spices; cook until the oil separates.",
						minutes: 15,
					},
				],
			},
		],
	},
	{
		kind: "programs",
		label: "Training program",
		icon: "Dumbbell",
		what: "A program of sessions over weeks, with the exercises it needs.",
		ask: "an 8-week calisthenics program for a first pull-up, 3 days a week, no gym",
		fields: `One item: { title, goal, summary, kind (hybrid, strength, skill, running, boxing, conditioning, recovery or gym), weeks (2-16), level (beginner, intermediate or advanced), equipment (any of: ${EQUIPMENT}), exercises [every exercise used: { id (lowercase-with-dashes), name, pattern (one of: ${PATTERNS}), unit (reps, s or min), level (1-10), equipment, each (true if done per side), weighted (true for loaded lifts), cues [three short tips] }], sessions [{ key, title, sport (calisthenics, running, boxing, yoga, gym), focus (upper, lower, full, run, boxing, skill, conditioning, mobility), minutes, effort (1-10), items [{ kind: "exercise", exercise (an id from exercises), sets, range [low, high] (reps, seconds or minutes by the exercise's unit), restS }] }], schedule { "<days a week>": [session keys in order] }, deloadEvery (e.g. 4, or null), testWeeks (true to test maximums in week 1 and the last week) }.`,
		example: [
			{
				title: "First pull-up",
				goal: "One strict pull-up in 8 weeks",
				summary: "Pulling strength three times a week, with rows and hangs.",
				kind: "skill",
				weeks: 8,
				level: "beginner",
				equipment: ["pull-up-bar"],
				exercises: [
					{
						id: "negative-pull-up",
						name: "Negative pull-up",
						pattern: "pull",
						unit: "reps",
						level: 3,
						equipment: ["pull-up-bar"],
						cues: ["Jump to the top", "Lower for 5 seconds", "Shoulders down"],
					},
					{
						id: "dead-hang",
						name: "Dead hang",
						pattern: "pull",
						unit: "s",
						level: 1,
						equipment: ["pull-up-bar"],
						cues: ["Full grip", "Relax the shoulders", "Breathe slowly"],
					},
				],
				sessions: [
					{
						key: "pull",
						title: "Pull day",
						sport: "calisthenics",
						focus: "upper",
						minutes: 30,
						effort: 6,
						items: [
							{
								kind: "exercise",
								exercise: "negative-pull-up",
								sets: 4,
								range: [3, 6],
								restS: 120,
							},
							{ kind: "exercise", exercise: "dead-hang", sets: 3, range: [20, 40], restS: 60 },
						],
					},
				],
				schedule: { "3": ["pull", "pull", "pull"] },
				deloadEvery: 4,
				testWeeks: true,
			},
		],
	},
	{
		kind: "exercises",
		label: "Exercises",
		icon: "Dumbbell",
		what: "Exercises with how-to cues, for your own programs and sessions.",
		ask: "12 mobility drills for desk workers",
		fields: `id (lowercase-with-dashes); name; pattern (one of: ${PATTERNS}); unit (reps, s or min); level (1-10); equipment (any of: ${EQUIPMENT}, or empty for none); each (true if done per side); weighted (true for loaded lifts); cues [three short tips, under 100 characters each].`,
		example: [
			{
				id: "worlds-greatest-stretch",
				name: "World's greatest stretch",
				pattern: "mobility",
				unit: "reps",
				level: 1,
				equipment: [],
				each: true,
				cues: ["Long lunge", "Elbow to the instep", "Rotate the arm to the sky"],
			},
		],
	},
	{
		kind: "care-routine",
		label: "Care routine",
		icon: "Drop",
		what: "Morning and night steps with how-to, the products they use, and small habits.",
		ask: "a simple routine for oily skin and dandruff, under 10 minutes a day",
		fields: `One item: { steps [{ routine (morning or night), area (face, hair or body), name, detail, productId (the name of a product below, or null), minutes, days (weekdays 0-6, 0 is Sunday; empty for every day), short (one word for the week strip), howTo }], products [{ name, area, lastsDays (how long one lasts), price, howTo }], habits [{ name, detail, link ("water" to read the water log, or null) }], areas [{ name, issue, care, metrics (any of: face-dryness, dark-spots, pores, tan, fine-lines, dandruff, hair-fall, greys, nails) }] }.`,
		example: [
			{
				steps: [
					{
						routine: "morning",
						area: "face",
						name: "Cleanser",
						detail: "Gel cleanser",
						productId: "Gel cleanser",
						minutes: 1,
						days: [],
						short: "Wash",
						howTo: "Massage a small amount into damp skin for a minute, then rinse.",
					},
				],
				products: [{ name: "Gel cleanser", area: "face", lastsDays: 90, price: 1200, howTo: "" }],
				habits: [{ name: "Drink water", detail: "2.5 L", link: "water" }],
				areas: [],
			},
		],
	},
	{
		kind: "tasbih",
		label: "Tasbih sequence",
		icon: "Star",
		what: "Phrases to count in order, each with its count.",
		ask: "the tasbih after prayer",
		fields: "label (in Latin letters); arabic; target (how many times).",
		example: [
			{ label: "SubhanAllah", arabic: "سُبْحَانَ اللهِ", target: 33 },
			{ label: "Alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ", target: 33 },
		],
	},
	{
		kind: "flashcards",
		label: "Flashcards",
		icon: "Layers",
		what: "Words and duas to learn with spaced review.",
		ask: "20 words from Surah Al-Fatiha with their meanings",
		fields:
			"kind (word or dua); front (the Arabic); prompt (the question to answer); back (the meaning); source (where it's from).",
		example: [
			{
				kind: "word",
				front: "صَبْر",
				prompt: "What does it mean?",
				back: "Patience",
				source: "Al-Baqarah 2:153",
			},
		],
	},
	{
		kind: "challenge",
		label: "Faith challenge",
		icon: "Lightning",
		what: "A daily step for a number of days, ticked off one day at a time.",
		ask: "a challenge to pray Fajr on time for three weeks",
		fields: "title; detail (the daily step); days (how many days).",
		example: [{ title: "Fajr on time for 21 days", detail: "Log Fajr every morning", days: 21 }],
	},
	{
		kind: "budget",
		label: "Budget",
		icon: "Wallet",
		what: "Monthly limits for each spending line, and what's always paid.",
		ask: "a monthly budget for a student living alone on 60,000",
		fields:
			"One item: { limits { food, bills, transport, care, giving, shopping, other: amount a month }, minimum [{ label, amount }] (what must be paid even in a bad month) }.",
		example: [
			{
				limits: {
					food: 20000,
					bills: 8000,
					transport: 5000,
					care: 2000,
					giving: 3000,
					shopping: 4000,
					other: 3000,
				},
				minimum: [
					{ label: "Rent", amount: 15000 },
					{ label: "Food", amount: 15000 },
				],
			},
		],
	},
	{
		kind: "minimum",
		label: "Minimum day",
		icon: "List",
		what: "The few things to do even on a bad day.",
		ask: "a minimum day for a busy parent",
		fields: "label (short, like a checklist item).",
		example: [{ label: "Walk 15 minutes" }, { label: "Read 10 pages" }],
	},
];

export function formatOf(kind: TemplateKind): TemplateFormat {
	const found = TEMPLATE_FORMATS.find((format) => format.kind === kind);
	if (!found) throw new Error(`No template format for ${kind}`);
	return found;
}

/**
 * The prompt to give any AI: the exact file shape, the item fields and an example, then what the
 * person wants. The reply is a template file they paste or import.
 */
export function templatePrompt(kind: TemplateKind, want: string): string {
	const format = formatOf(kind);
	const shape = {
		format: TEMPLATE_FORMAT,
		version: TEMPLATE_VERSION,
		kind,
		title: "A short title",
		summary: "One or two sentences on what's inside",
		author: "",
		items: format.example,
	};
	return [
		`Make a Personal OS template file (${format.label.toLowerCase()}).`,
		"Reply with ONLY the JSON, no other text, in exactly this shape:",
		JSON.stringify(shape, null, 1),
		`Each item in "items": ${format.fields}`,
		"Keep the example's field names exactly; replace the example items with your own. The example is short on purpose: make as many items, sessions and exercises as the request really needs.",
		`What I want: ${want.trim() || format.ask}`,
	].join("\n\n");
}
