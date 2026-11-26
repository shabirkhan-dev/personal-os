import { makeTemplateFile, type TemplateFile } from "@personal-os/domain/templates";

/**
 * Template packs the app offers from the server, next to the ones built into the app. Adding one
 * here reaches every phone without an app update. Each is a template file, the same shape people
 * share with each other; the app reads every item with its module's parser before saving it.
 */

const at = new Date("2026-11-25T00:00:00Z");

const pack = (
	input: Omit<Parameters<typeof makeTemplateFile>[0], "now" | "author">,
	id: string,
) => ({
	...makeTemplateFile({ ...input, author: "Personal OS", now: at }),
	id,
});

export const SERVER_PACKS: readonly TemplateFile[] = [
	pack(
		{
			kind: "tasbih",
			title: "Ramadan dhikr",
			summary:
				"Istighfar, the dua for Laylat al-Qadr and SubhanAllahi wa bihamdihi, in order, for the nights of Ramadan.",
			items: [
				{ id: "astaghfirullah", label: "Astaghfirullah", arabic: "أَسْتَغْفِرُ اللّٰهَ", target: 100 },
				{
					id: "allahumma-innaka-afuwwun",
					label: "Allahumma innaka afuwwun",
					arabic: "اللّٰهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
					target: 33,
				},
				{
					id: "subhanallahi-wa-bihamdihi",
					label: "SubhanAllahi wa bihamdihi",
					arabic: "سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ",
					target: 100,
				},
			],
		},
		"server-ramadan-dhikr",
	),
	pack(
		{
			kind: "minimum",
			title: "Busy-day minimum",
			summary:
				"Four things small enough for the busiest day: they keep the streak alive when nothing else fits.",
			items: [
				{ label: "Pray on time" },
				{ label: "Walk 10 minutes" },
				{ label: "Drink 2 litres of water" },
				{ label: "Read 2 pages" },
			],
		},
		"server-busy-day-minimum",
	),
	pack(
		{
			kind: "budget",
			title: "Student budget (Rs 35k)",
			summary:
				"A month on Rs 35,000: food first, transport, a small buffer, and something saved every month.",
			items: [
				{
					limits: {
						food: 14_000,
						bills: 5_000,
						transport: 5_000,
						care: 1_500,
						giving: 1_000,
						shopping: 2_500,
						dreams: 3_500,
						other: 2_500,
					},
					minimum: [
						{ label: "Food", amount: 12_000 },
						{ label: "Transport", amount: 4_000 },
						{ label: "Phone and internet", amount: 2_000 },
					],
				},
			],
		},
		"server-student-budget",
	),
	pack(
		{
			kind: "budget",
			title: "Family budget (Rs 150k)",
			summary:
				"A household month on Rs 150,000: rent and bills, groceries, school, giving and savings.",
			items: [
				{
					limits: {
						food: 45_000,
						bills: 50_000,
						transport: 15_000,
						care: 6_000,
						giving: 5_000,
						shopping: 9_000,
						dreams: 12_000,
						other: 8_000,
					},
					minimum: [
						{ label: "Rent", amount: 40_000 },
						{ label: "Groceries", amount: 35_000 },
						{ label: "Electricity, gas, water", amount: 12_000 },
						{ label: "School fees", amount: 10_000 },
					],
				},
			],
		},
		"server-family-budget",
	),
	pack(
		{
			kind: "care-routine",
			title: "Five-minute routine",
			summary:
				"Three steps in the morning, two at night: the least that still works, for busy days.",
			items: [
				{
					steps: [
						{
							routine: "morning",
							area: "face",
							name: "Gentle cleanser",
							detail: "30 seconds",
							howTo: "Lukewarm water, a small amount, massage for 30 seconds, rinse and pat dry.",
							minutes: 1,
							days: [],
						},
						{
							routine: "morning",
							area: "face",
							name: "Moisturiser",
							detail: "Pea size",
							howTo: "On slightly damp skin, pat in across the face and neck.",
							minutes: 1,
							days: [],
						},
						{
							routine: "morning",
							area: "face",
							name: "Sunscreen",
							detail: "Two finger lengths",
							howTo: "Last step, face, neck and ears. Again after 2 to 3 hours outside.",
							minutes: 1,
							days: [],
						},
						{
							routine: "night",
							area: "face",
							name: "Wash the day off",
							detail: "1 minute",
							howTo: "Cleanser for a full minute so sunscreen comes off, then rinse.",
							minutes: 1,
							days: [],
						},
						{
							routine: "night",
							area: "face",
							name: "Moisturiser",
							detail: "Pea size",
							howTo: "A little more than the morning if your skin feels tight.",
							minutes: 1,
							days: [],
						},
					],
					products: [],
					habits: [{ name: "Sleep 7 hours", detail: "Skin repairs at night" }],
					areas: [],
				},
			],
		},
		"server-five-minute-routine",
	),
	pack(
		{
			kind: "recipes",
			title: "Quick high-protein snacks",
			summary: "Three snacks in five minutes or less, each with 20 g of protein or more.",
			items: [
				{
					name: "Chana chaat",
					kind: "Snack",
					slots: ["snack"],
					tags: ["high-protein", "desi", "quick", "cheap"],
					minutes: 5,
					serves: 1,
					cost: 150,
					kcal: 380,
					protein: 20,
					carbs: 52,
					fat: 8,
					ingredients: [
						{ name: "Boiled chickpeas", amount: "1 cup" },
						{ name: "Onion and tomato", amount: "half each" },
						{ name: "Yogurt", amount: "3 tbsp" },
						{ name: "Chaat masala and lemon", amount: "to taste" },
					],
					steps: [
						{
							text: "Chop the onion and tomato, mix everything, finish with chaat masala and lemon.",
						},
					],
				},
				{
					name: "Egg and cheese wrap",
					kind: "Snack",
					slots: ["snack", "breakfast"],
					tags: ["high-protein", "quick"],
					minutes: 5,
					serves: 1,
					cost: 200,
					kcal: 420,
					protein: 26,
					carbs: 30,
					fat: 20,
					ingredients: [
						{ name: "Eggs", amount: "2" },
						{ name: "Wholewheat roti", amount: "1" },
						{ name: "Cheese slice", amount: "1" },
					],
					steps: [
						{ text: "Scramble the eggs in a hot pan.", minutes: 2 },
						{ text: "Warm the roti, add cheese and eggs, roll it up." },
					],
				},
				{
					name: "Dahi and peanut bowl",
					kind: "Snack",
					slots: ["snack", "bed"],
					tags: ["high-protein", "quick", "cheap"],
					minutes: 2,
					serves: 1,
					cost: 120,
					kcal: 360,
					protein: 22,
					carbs: 24,
					fat: 18,
					ingredients: [
						{ name: "Thick yogurt", amount: "250 g" },
						{ name: "Peanuts", amount: "2 tbsp" },
						{ name: "Honey", amount: "1 tsp" },
					],
					steps: [{ text: "Top the yogurt with peanuts and a little honey." }],
				},
			],
		},
		"server-protein-snacks",
	),
];
