import { GLASS_ML, type MealSlot } from "./meals";

/** What a line typed (or said) into the Food ask bar means. */
export type FoodLog =
	| { kind: "water"; ml: number }
	/** Name and calories are known: log it straight away. */
	| {
			kind: "meal";
			slot: MealSlot | null;
			name: string;
			kcal: number;
			protein?: number;
	  }
	/** Something is missing: open the Log meal sheet with what was understood. */
	| { kind: "draft"; slot: MealSlot | null; name: string; kcal: number | null };

const SLOT_WORDS: Record<string, MealSlot> = {
	breakfast: "breakfast",
	nashta: "breakfast",
	lunch: "lunch",
	snack: "snack",
	snacks: "snack",
	dinner: "dinner",
	supper: "dinner",
};

const WATER = /\b(water|pani|paani)\b/i;

function capitalise(text: string): string {
	return text.length > 0 ? text[0].toUpperCase() + text.slice(1) : text;
}

function tidy(text: string): string {
	return text
		.replace(/\s+/g, " ")
		.replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, "")
		.replace(/^(i\s+(had|ate)|had|ate|for)\s+/i, "")
		.replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, "")
		.trim();
}

function parseWater(text: string): number {
	const litre = /(\d+(?:\.\d+)?)\s*(l|litre|liter|litres|liters)\b/i.exec(text);
	if (litre) return Math.round(Number(litre[1]) * 1000);
	const ml = /(\d+)\s*ml\b/i.exec(text);
	if (ml) return Number(ml[1]);
	const glasses = /(\d+)\s*(glass|glasses|cups?)\b/i.exec(text);
	if (glasses) return Number(glasses[1]) * GLASS_ML;
	const bare = /\b(\d+)\b/.exec(text);
	if (bare) {
		const value = Number(bare[1]);
		// "water 3" means glasses; "water 400" means millilitres.
		return value <= 10 ? value * GLASS_ML : value;
	}
	return GLASS_ML;
}

/**
 * Reads "2 rotis and daal 450 kcal", "water 500ml" or "lunch biryani 700". Returns null for an
 * empty line.
 */
export function parseFoodText(input: string): FoodLog | null {
	let text = input.trim();
	if (!text) return null;

	if (WATER.test(text)) {
		const ml = parseWater(text.replace(WATER, " "));
		if (ml > 0 && ml <= 5000) return { kind: "water", ml };
	}

	let slot: MealSlot | null = null;
	const slotMatch = new RegExp(`\\b(${Object.keys(SLOT_WORDS).join("|")})\\b`, "i").exec(text);
	if (slotMatch) {
		slot = SLOT_WORDS[slotMatch[1].toLowerCase()] ?? null;
		text = `${text.slice(0, slotMatch.index)} ${text.slice(slotMatch.index + slotMatch[0].length)}`;
	}

	let protein: number | undefined;
	const proteinMatch =
		/(\d+(?:\.\d+)?)\s*g(?:rams?)?\s*(?:of\s+)?protein\b/i.exec(text) ??
		/\bprotein\s*(\d+(?:\.\d+)?)\s*g?\b/i.exec(text);
	if (proteinMatch) {
		protein = Math.round(Number(proteinMatch[1]));
		text = text.replace(proteinMatch[0], " ");
	}

	let kcal: number | null = null;
	const unit = /(\d[\d,]*)\s*(kcal|cal|cals|calories|kcals)\b/i.exec(text);
	if (unit) {
		kcal = Number(unit[1].replace(/,/g, ""));
		text = text.replace(unit[0], " ");
	} else {
		const trailing = /(?:^|\s)(\d[\d,]*)\s*$/.exec(text);
		// A bare trailing number of 50+ reads as calories ("biryani 700"); "2 rotis" does not.
		if (trailing && Number(trailing[1].replace(/,/g, "")) >= 50) {
			kcal = Number(trailing[1].replace(/,/g, ""));
			text = text.slice(0, trailing.index);
		}
	}

	const name = capitalise(tidy(text));
	if (name && kcal !== null && kcal > 0 && kcal <= 5000) {
		return protein === undefined
			? { kind: "meal", slot, name, kcal }
			: { kind: "meal", slot, name, kcal, protein };
	}
	return { kind: "draft", slot, name, kcal: kcal !== null && kcal > 0 ? kcal : null };
}
