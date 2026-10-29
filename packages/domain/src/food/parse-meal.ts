import type { FoodItem, Slot } from "./model";
import { ALIASES, type Food } from "./foods";

/**
 * Reads what the person typed or said, on the phone: "2 fried eggs, one paratha and a cup of chai
 * with milk" becomes three items with their macros. Words it doesn't know are returned too, so the
 * Food AI can read the line when there is a connection.
 */

const SLOT_WORDS: readonly [RegExp, Slot][] = [
	[/\b(breakfast|nashta|nashtay)\b/, "breakfast"],
	[/\b(lunch|dopahar)\b/, "lunch"],
	[/\b(dinner|supper|raat ka khana)\b/, "dinner"],
	[/\b(before bed|bedtime|before sleep)\b/, "bed"],
	[/\b(snack|snacks|evening snack)\b/, "snack"],
];

const NUMBER_WORDS: Record<string, number> = {
	a: 1,
	an: 1,
	one: 1,
	two: 2,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	half: 0.5,
	couple: 2,
	ek: 1,
	do: 2,
	teen: 3,
};

const UNIT_WORDS =
	/\b(cups?|plates?|bowls?|glass(es)?|slices?|tbsp|tablespoons?|scoops?|handfuls?|pieces?|pcs|cans?|of)\b/g;
const FILLER =
	/\b(i|had|ate|have|eaten|and|with|some|for|the|my|today|just|also|a|an|then|plus|little|bit)\b/g;

export type MealParse = {
	items: FoodItem[];
	/** Words left over that aren't a known food ("quinoa"). */
	unmatched: string[];
	slot: Slot | null;
};

export function itemFrom(food: Food, quantity: number): FoodItem {
	const scale = (value: number) => Math.round(value * quantity * 10) / 10;
	return {
		name: food.name,
		quantity,
		unit: food.unit,
		foodId: food.id,
		kcal: Math.round(food.kcal * quantity),
		protein: scale(food.protein),
		carbs: scale(food.carbs),
		fat: scale(food.fat),
	};
}

/** The same item at a new quantity, scaling its macros. */
export function withQuantity(item: FoodItem, quantity: number): FoodItem {
	const ratio = quantity / item.quantity;
	const scale = (value: number) => Math.round(value * ratio * 10) / 10;
	return {
		...item,
		quantity,
		kcal: Math.round(item.kcal * ratio),
		protein: scale(item.protein),
		carbs: scale(item.carbs),
		fat: scale(item.fat),
	};
}

function quantityBefore(text: string, at: number): number {
	const before = text.slice(Math.max(0, at - 24), at).trim();
	const digits = /(\d+(?:\.\d+)?|½|¼)\s*(?:[a-z]+\s*){0,2}$/.exec(before);
	if (digits?.[1]) {
		if (digits[1] === "½") return 0.5;
		if (digits[1] === "¼") return 0.25;
		return Math.min(20, Number(digits[1]));
	}
	const word =
		/\b(a|an|one|two|three|four|five|six|half|couple|ek|do|teen)\b(?:\s+(?:of\s+)?[a-z]+){0,2}\s*$/.exec(
			before,
		);
	if (word?.[1]) return NUMBER_WORDS[word[1]] ?? 1;
	return 1;
}

export function parseMealText(input: string): MealParse {
	let text = ` ${input.toLowerCase().replace(/[’']/g, "")} `;
	let slot: Slot | null = null;
	for (const [pattern, value] of SLOT_WORDS) {
		if (pattern.test(text)) {
			slot = value;
			text = text.replace(pattern, " ");
			break;
		}
	}
	const kcal = /(\d{2,4})\s*(k?cal|calories)\b/.exec(text);
	if (kcal) text = text.replace(kcal[0], " ");

	const found: { at: number; item: FoodItem }[] = [];
	const used: [number, number][] = [];
	for (const { alias, food } of ALIASES) {
		let from = 0;
		for (;;) {
			const at = text.indexOf(alias, from);
			if (at < 0) break;
			const end = at + alias.length;
			from = end;
			const bounded = !/[a-z]/.test(text[at - 1] ?? " ") && !/[a-z]/.test(text[end] ?? " ");
			if (!bounded || used.some(([start, stop]) => at < stop && end > start)) continue;
			used.push([at, end]);
			found.push({ at, item: itemFrom(food, quantityBefore(text, at)) });
		}
	}
	// In the order the line names them.
	const clean = found.sort((a, b) => a.at - b.at).map((entry) => entry.item);

	let rest = text;
	for (const [start, stop] of [...used].sort((a, b) => b[0] - a[0])) {
		rest = `${rest.slice(0, start)} ${rest.slice(stop)}`;
	}
	const unmatched = rest
		.replace(/[\d½¼.,;+&!?-]/g, " ")
		.replace(UNIT_WORDS, " ")
		.replace(FILLER, " ")
		.replace(/\b(one|two|three|four|five|six|half|couple|ek|do|teen)\b/g, " ")
		.split(/\s+/)
		.filter((word) => word.length > 2);

	// "biryani 700 kcal" with a known food: the stated calories win for a single item.
	if (kcal?.[1] && clean.length === 1 && clean[0]) {
		const stated = Number(kcal[1]);
		const ratio = stated / Math.max(1, clean[0].kcal);
		clean[0] = {
			...clean[0],
			kcal: stated,
			protein: Math.round(clean[0].protein * ratio * 10) / 10,
			carbs: Math.round(clean[0].carbs * ratio * 10) / 10,
			fat: Math.round(clean[0].fat * ratio * 10) / 10,
		};
	} else if (kcal?.[1] && clean.length === 0 && unmatched.length > 0) {
		clean.push({
			name: capital(unmatched.join(" ")),
			quantity: 1,
			unit: "",
			foodId: null,
			kcal: Number(kcal[1]),
			protein: 0,
			carbs: 0,
			fat: 0,
		});
		return { items: clean, unmatched: [], slot };
	}
	return { items: clean, unmatched, slot };
}

export function capital(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export type FoodScreen = "plan" | "grocery" | "recipes" | "insights";

export type FoodIntent =
	| { kind: "water"; ml: number }
	| { kind: "weight"; kg: number }
	| { kind: "meal"; parse: MealParse; text: string }
	| { kind: "open"; screen: FoodScreen }
	| { kind: "question"; text: string };

const SCREENS: readonly [RegExp, FoodScreen][] = [
	[/\b(meal plan|plan (my )?(week|meals)|weekly plan)\b/, "plan"],
	[/\b(grocery|groceries|shopping list|sauda)\b/, "grocery"],
	[/\b(recipes?|cook something)\b/, "recipes"],
	[/\b(insights?|recap)\b/, "insights"],
];

function waterMl(text: string): number {
	const litres = /(\d+(?:\.\d+)?)\s*(l|litres?|liters?)\b/.exec(text);
	if (litres?.[1]) return Math.round(Number(litres[1]) * 1000);
	const ml = /(\d+)\s*ml\b/.exec(text);
	if (ml?.[1]) return Number(ml[1]);
	const glasses = /(\d+|a|one|two|three)\s*(glass|glasses|cups?|bottles?)\b/.exec(text);
	if (glasses?.[1]) {
		const count = NUMBER_WORDS[glasses[1]] ?? Number(glasses[1]);
		return count * (/bottle/.test(glasses[2] ?? "") ? 500 : 250);
	}
	return 250;
}

export function parseFoodLine(input: string): FoodIntent | null {
	const text = input.trim().toLowerCase();
	if (!text) return null;
	const question = /\?$|^(what|which|how|should|can|is|does|do|tell me|suggest)\b/.test(text);
	if (!question) {
		const weight = /\b(weigh(ed|t|ing)?|wazan)\b[^\d]*(\d{2,3}(?:\.\d)?)\s*(kg)?/.exec(text);
		if (weight?.[3]) return { kind: "weight", kg: Number(weight[3]) };
		if (/\b(water|pani|paani)\b/.test(text) && !/\b(with|in)\s+water\b/.test(text)) {
			return { kind: "water", ml: Math.min(3000, waterMl(text)) };
		}
		for (const [pattern, screen] of SCREENS) {
			if (pattern.test(text) && text.split(/\s+/).length <= 5) return { kind: "open", screen };
		}
		const parse = parseMealText(input);
		if (parse.items.length > 0 || /\b(ate|had|eaten|khaya)\b/.test(text))
			return { kind: "meal", parse, text: input.trim() };
	}
	return { kind: "question", text: input.trim() };
}
