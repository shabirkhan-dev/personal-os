import type { Habit, Product, Routine, Step } from "./care-model";

/**
 * Reads a line from Care's ask bar on the phone: "did my morning routine", "used sunscreen",
 * "washed my hair", "trimmed nails", "bought a new cleanser", "open shelf". Anything else is a
 * question for the Care AI.
 */

export type CareScreen = "shelf" | "routine" | "hair" | "body" | "check-in" | "insights";

export type CareIntent =
	| { kind: "routine"; routine: Routine }
	| { kind: "steps"; stepIds: string[]; habitIds: string[] }
	| { kind: "restock"; productId: string }
	| { kind: "open"; screen: CareScreen }
	| { kind: "question"; text: string };

const SCREENS: readonly [RegExp, CareScreen][] = [
	[/\b(shelf|products)\b/, "shelf"],
	[/\b(routines?)\b/, "routine"],
	[/\b(hair|scalp)\b/, "hair"],
	[/\b(body|nails)\b/, "body"],
	[/\b(check[- ]?in)\b/, "check-in"],
	[/\b(insights?|recap)\b/, "insights"],
];

/** Extra words for steps people name differently. */
const SYNONYMS: readonly [RegExp, RegExp][] = [
	[/\b(spf|sunblock)\b/, /sunscreen/i],
	[/\b(washed|wash)\b.*\bhair\b|\bshampoo(ed)?\b/, /wash|shampoo/i],
	[/\boil(ed)?\b/, /oil/i],
	[/\b(trim(med)?|cut|clipped)\b.*\bnails?\b|\bnails?\b/, /nail/i],
	[/\bscrub(bed)?\b/, /scrub/i],
	[/\bcomb(ed)?\b/, /comb/i],
	[/\b(moisturi[sz]ed?|cream)\b/, /cream|moisturi/i],
	[/\blotion\b/, /lotion/i],
	[/\b(face ?wash|cleansed?|cleanser)\b/, /cleanser/i],
	[/\bserum|niacinamide\b/, /serum/i],
];

const HABIT_WORDS: readonly [RegExp, RegExp][] = [
	[/\bfloss(ed)?\b/, /floss/i],
	[/\bbrush(ed)?\b.*\bteeth\b|\bteeth\b/, /brush/i],
];

const DID =
	/\b(did|done|used|put|applied|washed|oiled|trimmed|cut|flossed|brushed|scrubbed|combed|finished|moisturi[sz]ed|cleansed|shampooed)\b/;

export function parseCareLine(
	input: string,
	context: {
		steps: readonly Step[];
		habits: readonly Habit[];
		products: readonly Product[];
		routine: Routine;
	},
): CareIntent | null {
	const text = input.trim().toLowerCase();
	if (!text) return null;
	const question = /\?$|^(what|which|how|should|can|is|does|do|why|tell me|suggest)\b/.test(text);
	if (question) return { kind: "question", text: input.trim() };

	const bought = /\b(bought|got|new|restock(ed)?|opened|reordered)\b/.test(text);
	if (bought) {
		const product = context.products.find((item) =>
			item.name
				.toLowerCase()
				.split(/\s+/)
				.some((word) => word.length > 3 && text.includes(word)),
		);
		if (product) return { kind: "restock", productId: product.id };
	}

	const routine = /\b(morning|am)\b/.test(text)
		? "morning"
		: /\b(night|pm|evening)\b/.test(text)
			? "night"
			: null;
	if (routine && /\b(routine|done|did|finished|all)\b/.test(text))
		return { kind: "routine", routine };

	if (DID.test(text) || /\b(spf|sunscreen|floss)\b/.test(text)) {
		const pool = context.steps.filter((step) => step.routine === (routine ?? context.routine));
		const stepIds = new Set<string>();
		for (const [said, name] of SYNONYMS) {
			if (!said.test(text)) continue;
			const match =
				pool.find((step) => name.test(step.name)) ??
				context.steps.find((step) => name.test(step.name));
			if (match) stepIds.add(match.id);
		}
		for (const step of pool) {
			const words = step.name
				.toLowerCase()
				.split(/\s+/)
				.filter((word) => word.length > 3);
			if (words.some((word) => text.includes(word))) stepIds.add(step.id);
		}
		const habitIds = HABIT_WORDS.flatMap(([said, name]) => {
			if (!said.test(text)) return [];
			const habit = context.habits.find((item) => name.test(item.name));
			return habit ? [habit.id] : [];
		});
		if (stepIds.size > 0 || habitIds.length > 0)
			return { kind: "steps", stepIds: [...stepIds], habitIds };
	}

	for (const [pattern, screen] of SCREENS) {
		if (pattern.test(text) && text.split(/\s+/).length <= 4) return { kind: "open", screen };
	}
	return { kind: "question", text: input.trim() };
}
