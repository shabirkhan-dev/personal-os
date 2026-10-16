import type { Category, Method } from "./finance-model";

/**
 * Reads a line from Finance's ask bar: "chicken 1 kg 800 and milk 4 litre 880, cash",
 * "fuel 1500", "got 45000 contract payment", "saved 5k", a screen to open, or a question.
 * Spending can hold several items; each needs its own amount, or the line goes to the AI.
 */

export type FinanceScreen = "runway" | "budget" | "history" | "income" | "insights" | "bills";

export type SpendItem = { name: string; amount: number; category: Category };

export type FinanceIntent =
	| { kind: "spend"; items: SpendItem[]; method: Method | null }
	| { kind: "income"; amount: number; title: string; clean: boolean }
	| { kind: "save"; amount: number }
	| { kind: "open"; screen: FinanceScreen }
	| { kind: "question"; text: string }
	/** Money words but no amounts the phone can split; the AI reads it. */
	| { kind: "unclear"; text: string };

const WORDS: Record<Exclude<Category, "other">, readonly string[]> = {
	food: [
		"food",
		"lunch",
		"dinner",
		"breakfast",
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
		"fruits",
		"bakery",
		"chicken",
		"beef",
		"mutton",
		"meat",
		"fish",
		"milk",
		"eggs",
		"egg",
		"bread",
		"rice",
		"atta",
		"flour",
		"daal",
		"dal",
		"lentils",
		"oats",
		"yogurt",
		"dahi",
		"vegetables",
		"veg",
		"sabzi",
		"bananas",
		"banana",
		"oil",
		"ghee",
		"sugar",
		"water",
		"peanut",
	],
	bills: [
		"bill",
		"bills",
		"electricity",
		"gas",
		"internet",
		"wifi",
		"rent",
		"phone",
		"mobile",
		"package",
		"subscription",
		"netflix",
		"utilities",
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
		"bike",
		"service",
		"tyre",
		"tire",
	],
	care: [
		"sunscreen",
		"spf",
		"lotion",
		"moisturiser",
		"moisturizer",
		"cleanser",
		"shampoo",
		"conditioner",
		"soap",
		"razor",
		"barber",
		"haircut",
		"trim",
		"toothpaste",
		"floss",
		"deodorant",
		"serum",
		"pharmacy",
		"medicine",
	],
	giving: [
		"sadqa",
		"sadaqah",
		"sadqah",
		"charity",
		"donation",
		"donated",
		"zakat",
		"family",
		"home",
		"mother",
		"mom",
		"ammi",
		"father",
		"abbu",
		"gift",
	],
	shopping: ["shopping", "clothes", "shoes", "shirt", "jeans", "watch", "perfume", "daraz", "mall"],
};

const FILLER = new Set([
	"spent",
	"spend",
	"paid",
	"pay",
	"bought",
	"buy",
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
	"rs",
	"pkr",
	"rupees",
	"rupee",
	"today",
	"just",
]);

const METHOD_WORDS: readonly [RegExp, Method][] = [
	[/\b(cash)\b/, "cash"],
	[/\b(bank|card|debit|transfer)\b/, "bank"],
	[/\b(wallet|jazzcash|easypaisa|sadapay|nayapay)\b/, "wallet"],
];

const SCREENS: readonly [RegExp, FinanceScreen][] = [
	[/\brunway\b/, "runway"],
	[/\bbudget|limits?\b/, "budget"],
	[/\bhistory|entries|transactions\b/, "history"],
	[/\bincome|halal|sources?\b/, "income"],
	[/\binsights?|recap\b/, "insights"],
	[/\bbills?\b/, "bills"],
];

const UNIT =
	/(\d+(?:\.\d+)?)\s*(kg|kgs|g|gm|grams?|l|ltr|litres?|liters?|ml|dozen|pcs|pieces?|packs?|x)\b/g;
const AMOUNT = /(?:rs\.?\s*)?(\d{1,3}(?:,\d{3})+|\d+(?:\.\d{1,2})?)(k)?\b/g;

const UNIT_LABEL: Record<string, string> = {
	l: "L",
	ltr: "L",
	litre: "L",
	litres: "L",
	liter: "L",
	liters: "L",
	kgs: "kg",
	gm: "g",
	gram: "g",
	grams: "g",
	piece: "pcs",
	pieces: "pcs",
	pack: "packs",
	x: "×",
};

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function categoryOf(text: string): Category {
	const words = text.toLowerCase().split(/[^a-z]+/);
	for (const [category, list] of Object.entries(WORDS)) {
		if (words.some((word) => list.includes(word))) return category as Category;
	}
	return "other";
}

function amountsIn(text: string): number[] {
	const found: number[] = [];
	for (const match of text.matchAll(AMOUNT)) {
		const value = Number((match[1] ?? "").replace(/,/g, "")) * (match[2] ? 1000 : 1);
		if (value > 0) found.push(Math.round(value * 100) / 100);
	}
	return found;
}

/** One part of the line: "chicken 1 kg 800" → Chicken · 1 kg, Rs 800. */
function readPart(part: string): { name: string; amount: number | null } {
	const quantities: string[] = [];
	const rest = part.replace(UNIT, (_, value: string, unit: string) => {
		quantities.push(`${value} ${UNIT_LABEL[unit] ?? unit}`);
		return " ";
	});
	const amounts = amountsIn(rest);
	const words = rest
		.replace(AMOUNT, " ")
		.split(/\s+/)
		.map((word) => word.replace(/[^\p{L}'-]/gu, ""))
		.filter((word) => word && !FILLER.has(word));
	const name = words.join(" ");
	return {
		name: quantities.length > 0 && name ? `${name} · ${quantities.join(", ")}` : name,
		amount: amounts.at(-1) ?? null,
	};
}

export function parseFinanceLine(input: string): FinanceIntent | null {
	const raw = input.trim();
	const text = raw.toLowerCase();
	if (!text) return null;
	if (/\?$|^(what|which|how|should|can|is|does|do|why|when|will|tell me|suggest)\b/.test(text)) {
		return { kind: "question", text: raw };
	}
	const hasNumber = /\d/.test(text);
	if (!hasNumber && text.split(/\s+/).length <= 3) {
		for (const [pattern, screen] of SCREENS) {
			if (pattern.test(text)) return { kind: "open", screen };
		}
	}
	if (!hasNumber) {
		return /\b(spent|paid|bought|got|received)\b/.test(text)
			? { kind: "unclear", text: raw }
			: { kind: "question", text: raw };
	}

	if (/\b(saved|save|put aside|set aside)\b/.test(text) && !/\b(spent|paid|bought)\b/.test(text)) {
		const amount = amountsIn(text).at(-1);
		if (amount) return { kind: "save", amount };
	}

	if (
		/\b(got|received|earned|salary|income|payment from|got paid|paid me|profit|interest|freelance)\b/.test(
			text,
		) &&
		!/\b(spent|bought)\b/.test(text)
	) {
		const amount = amountsIn(text).at(-1);
		if (amount) {
			const title = capitalise(
				text
					.replace(AMOUNT, " ")
					.replace(/\b(got|received|earned|paid me|got paid|from|rs|pkr|rupees|i|my|a|the)\b/g, " ")
					.replace(/\s+/g, " ")
					.trim(),
			);
			return {
				kind: "income",
				amount,
				title: title || "Income",
				clean: !/\binterest\b/.test(text),
			};
		}
	}

	let method: Method | null = null;
	for (const [pattern, value] of METHOD_WORDS) {
		if (pattern.test(text)) {
			method = value;
			break;
		}
	}
	const methodWords =
		/\b(cash|bank|card|debit|transfer|wallet|jazzcash|easypaisa|sadapay|nayapay|with|by|via)\b/g;
	const parts = text
		.replace(/(\d),(?=\d{3}\b)/g, "$1")
		.split(/,|;|\+|\band\b|\n/)
		.map((part) => part.replace(methodWords, " ").trim())
		.filter(Boolean);

	const items: SpendItem[] = [];
	let pending: string[] = [];
	for (const part of parts) {
		const { name, amount } = readPart(part);
		if (amount === null) {
			if (name) pending.push(name);
			continue;
		}
		const full = [...pending, name].filter(Boolean).join(", ") || "Spending";
		pending = [];
		items.push({ name: capitalise(full), amount, category: categoryOf(full) });
	}
	const last = items.at(-1);
	if (last && pending.length > 0) {
		last.name = [last.name, ...pending].join(", ");
		if (last.category === "other") last.category = categoryOf(last.name);
	}
	if (items.length === 0) return { kind: "unclear", text: raw };
	return { kind: "spend", items, method };
}
