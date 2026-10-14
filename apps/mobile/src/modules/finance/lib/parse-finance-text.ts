import type { ExpenseCategory } from "./finance-model";

/** What a line typed in the Finance ask bar means. */
export type FinanceIntent =
	| { kind: "expense"; amount: number; category: ExpenseCategory; note: string }
	| { kind: "budget"; amount: number }
	| { kind: "saving"; amount: number }
	| {
			kind: "unclear";
			amount: number | null;
			category: ExpenseCategory | null;
			note: string;
	  };

const KEYWORDS: Record<Exclude<ExpenseCategory, "other">, readonly string[]> = {
	food: [
		"food",
		"lunch",
		"dinner",
		"breakfast",
		"brunch",
		"coffee",
		"tea",
		"chai",
		"snack",
		"snacks",
		"grocery",
		"groceries",
		"restaurant",
		"meal",
		"pizza",
		"burger",
		"biryani",
		"fruit",
		"bakery",
		"foodpanda",
	],
	shopping: [
		"shopping",
		"clothes",
		"shoes",
		"shirt",
		"dress",
		"gift",
		"amazon",
		"daraz",
		"mall",
		"makeup",
		"skincare",
	],
	transport: [
		"transport",
		"uber",
		"careem",
		"indrive",
		"taxi",
		"cab",
		"ride",
		"fuel",
		"petrol",
		"diesel",
		"bus",
		"metro",
		"train",
		"rickshaw",
		"parking",
		"toll",
	],
	bills: [
		"bill",
		"bills",
		"electricity",
		"gas",
		"water",
		"internet",
		"wifi",
		"rent",
		"phone",
		"mobile",
		"subscription",
		"netflix",
		"utilities",
	],
};

/** Words that only carry grammar or the currency. */
const FILLER = new Set([
	"spent",
	"spend",
	"paid",
	"pay",
	"bought",
	"on",
	"for",
	"at",
	"to",
	"of",
	"a",
	"an",
	"the",
	"i",
	"my",
	"and",
	"rs",
	"rs.",
	"pkr",
	"rupees",
	"rupee",
	"today",
]);

const CATEGORY_WORDS = new Set(["food", "shopping", "transport", "bill", "bills", "other"]);
const BUDGET_WORDS = new Set(["budget"]);
const SAVING_WORDS = new Set(["save", "saved", "saving", "savings"]);

const AMOUNT = /^(?:rs\.?|pkr)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d{1,2})?(k)?$/;

function readAmount(token: string): number | null {
	const match = AMOUNT.exec(token);
	if (!match) return null;
	const whole = Number((match[1] ?? "").replace(/,/g, ""));
	const decimal = match[2] ? Number(match[2]) : 0;
	const value = (whole + decimal) * (match[3] ? 1000 : 1);
	return value > 0 ? Math.round(value * 100) / 100 : null;
}

export function categoryFor(word: string): ExpenseCategory | null {
	for (const [category, words] of Object.entries(KEYWORDS)) {
		if (words.includes(word)) return category as ExpenseCategory;
	}
	return null;
}

function capitalise(text: string): string {
	return text.length > 0 ? `${text[0]?.toUpperCase() ?? ""}${text.slice(1)}` : text;
}

/**
 * Reads "500 food", "spent 1200 on transport", "rs 300 lunch", "budget 60000" or "saved 2k".
 * Exactly one amount is needed to act; anything else comes back "unclear" with what was found so
 * the Add expense sheet can open prefilled.
 */
export function parseFinanceText(text: string): FinanceIntent {
	const tokens = text
		.replace(/\b(rs|pkr)\.?\s+(?=\d)/gi, "rs")
		.replace(/[!?;:]/g, " ")
		.split(/\s+/)
		.map((token) => token.replace(/^[^\w.]+|[^\w]+$/g, ""))
		.filter((token) => token.length > 0);

	const amounts: number[] = [];
	const words: string[] = [];
	for (const token of tokens) {
		const amount = readAmount(token.toLowerCase());
		if (amount !== null) amounts.push(amount);
		else words.push(token);
	}

	let category: ExpenseCategory | null = null;
	const lower = words.map((word) => word.toLowerCase());
	for (const word of lower) {
		category = categoryFor(word);
		if (category) break;
	}
	const note = capitalise(
		words
			.filter((word) => !FILLER.has(word.toLowerCase()) && !CATEGORY_WORDS.has(word.toLowerCase()))
			.join(" "),
	);
	const amount = amounts.length === 1 ? (amounts[0] ?? null) : null;

	if (amount === null) return { kind: "unclear", amount: null, category, note };
	if (lower.some((word) => BUDGET_WORDS.has(word))) return { kind: "budget", amount };
	if (!category && lower.some((word) => SAVING_WORDS.has(word))) return { kind: "saving", amount };
	return { kind: "expense", amount, category: category ?? "other", note };
}
