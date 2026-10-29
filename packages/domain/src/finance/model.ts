import { asArray, asBoolean, asNumber, asString, isRecord, oneOf } from "../parse";

/**
 * Finance's documents: settings (money now, what a month costs, limits, the minimum), entries
 * (money out and in), bills and income sources. Each is read back through `parse` so an older or
 * damaged row becomes a valid value.
 */

export const CATEGORIES = [
	"food",
	"bills",
	"transport",
	"care",
	"giving",
	"shopping",
	"dreams",
	"other",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** Lines spending can be logged on; Dreams only fills through Wishlist's Add savings. */
export const SPEND_CATEGORIES = CATEGORIES.filter((category) => category !== "dreams");

export const CATEGORY_LABELS: Record<Category, string> = {
	food: "Food",
	bills: "Bills",
	transport: "Transport",
	care: "Care",
	giving: "Giving and family",
	shopping: "Shopping",
	dreams: "Dreams",
	other: "Buffer",
};

/** Short names for legends and history rows. */
export const CATEGORY_SHORT: Record<Category, string> = {
	...CATEGORY_LABELS,
	giving: "Giving",
	other: "Other",
};

/** What each budget line is for, when nothing has been spent on it yet. */
export const CATEGORY_HINTS: Record<Category, string> = {
	food: "Groceries and eating out",
	bills: "Electricity, internet, phone",
	transport: "Fuel and rides",
	care: "Skin, hair, body",
	giving: "Sadqa and home",
	shopping: "Clothes and things",
	dreams: "Put aside for your wishlist",
	other: "Unplanned",
};

export const METHODS = ["cash", "bank", "wallet"] as const;
export type Method = (typeof METHODS)[number];
export const METHOD_LABELS: Record<Method, string> = {
	cash: "Cash",
	bank: "Bank",
	wallet: "Mobile wallet",
};

export type Entry = {
	id: string;
	kind: "spend" | "income";
	amount: number;
	/** Spending's budget line; income is always "other". */
	category: Category;
	title: string;
	note: string;
	method: Method;
	/** Income: where it came from. */
	sourceId: string | null;
	/** Income: false when it is interest (riba) to give away. */
	clean: boolean;
	/** Spending: interest given away, which is not counted as charity. */
	purify: boolean;
	/** The bill this paid, if any. */
	billId: string | null;
	/** "YYYY-MM" month the bill payment covered; null for older entries (then its own month). */
	billMonth: string | null;
	/**
	 * Wishlist's Add savings: the budget line this Dreams money was moved from. The move holds for
	 * the entry's month only (see `monthLimits`); null for anything else and for older transfers.
	 */
	movedFrom: Category | null;
	/** ISO time it happened. */
	at: string;
	receiptUri: string | null;
};

export type Bill = {
	id: string;
	name: string;
	/** "Gesco", "Fibre", "Prepaid". */
	provider: string;
	amount: number;
	/** Day of the month it is due, 1–31 (the last day for shorter months). */
	dueDay: number;
	category: Category;
	/** "YYYY-MM" months already paid. */
	paid: string[];
	/** "YYYY-MM" month it was added; null for bills saved before this was kept. */
	since: string | null;
};

export type Source = {
	id: string;
	name: string;
	note: string;
	/** False for an account that pays interest. */
	halal: boolean;
};

export type MinimumItem = { label: string; amount: number };

export type FinanceSettings = {
	id: "settings";
	setUp: boolean;
	/** Money on hand when it was last set, and when. */
	balance: number;
	balanceAt: string;
	/** What a normal month costs. */
	monthlyCost: number;
	/** Fixed income each month (0 while job hunting). */
	monthlyIncome: number;
	/** Expected pay once a job starts, for the what-ifs; 0 means "covers the month". */
	salary: number;
	/** Monthly limit per budget line. */
	limits: Record<Category, number>;
	/** The essentials that are always paid. */
	minimum: MinimumItem[];
	/** Runway counts only the minimum while true. */
	protect: boolean;
	/** "After the job" savings goal and what is put aside so far. */
	savingsTarget: number;
	saved: number;
};

// --- defaults -----------------------------------------------------------------------------------

/** The Figma split of a Rs 55,000 month, scaled to whatever a month costs. */
const SHARES: Record<Category, number> = {
	food: 24 / 55,
	bills: 7.2 / 55,
	transport: 5 / 55,
	care: 2.6 / 55,
	giving: 8 / 55,
	shopping: 0,
	dreams: 0,
	other: 8.2 / 55,
};

export function defaultLimits(monthlyCost: number): Record<Category, number> {
	const limits = {} as Record<Category, number>;
	let given = 0;
	for (const category of CATEGORIES) {
		if (category === "other") continue;
		const amount = Math.round((monthlyCost * SHARES[category]) / 100) * 100;
		limits[category] = amount;
		given += amount;
	}
	limits.other = Math.max(0, monthlyCost - given);
	return limits;
}

export function defaultMinimum(limits: Record<Category, number>): MinimumItem[] {
	return [
		{ label: "Food", amount: limits.food },
		{ label: "Bills", amount: limits.bills },
		{ label: "Transport", amount: limits.transport },
		{ label: "Care basics", amount: limits.care },
	].filter((item) => item.amount > 0);
}

export function defaultSettings(now = new Date()): FinanceSettings {
	const limits = defaultLimits(55_000);
	return {
		id: "settings",
		setUp: false,
		balance: 0,
		balanceAt: now.toISOString(),
		monthlyCost: 55_000,
		monthlyIncome: 0,
		salary: 0,
		limits,
		minimum: defaultMinimum(limits),
		protect: false,
		savingsTarget: 6 * 55_000,
		saved: 0,
	};
}

// --- parsing ------------------------------------------------------------------------------------

const asIso = (value: unknown) =>
	typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
const money = (value: unknown, fallback: number) =>
	Math.min(1_000_000_000, Math.max(0, Math.round(asNumber(value, fallback) * 100) / 100));
/** Money on hand can be overdrawn, so it keeps its sign. */
const signedMoney = (value: unknown) =>
	Math.min(1_000_000_000, Math.max(-1_000_000_000, Math.round(asNumber(value, 0) * 100) / 100));
const text = (value: unknown, max: number) => asString(value, "").trim().slice(0, max);
const isMonth = (value: unknown): value is string =>
	typeof value === "string" && /^\d{4}-\d{2}$/.test(value);
const isLine = (value: unknown): value is Category =>
	typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
const id = (value: unknown) => (typeof value === "string" && value ? value : null);

export function parseSettings(raw: unknown): FinanceSettings | null {
	if (!isRecord(raw)) return null;
	const base = defaultSettings();
	const monthlyCost = money(raw.monthlyCost, base.monthlyCost);
	const fallback = defaultLimits(monthlyCost);
	const limitsRaw = isRecord(raw.limits) ? raw.limits : {};
	const limits = {} as Record<Category, number>;
	for (const category of CATEGORIES) {
		limits[category] = money(limitsRaw[category], fallback[category]);
	}
	const minimum = asArray(raw.minimum, (item) => {
		if (!isRecord(item)) return null;
		const label = text(item.label, 40);
		const amount = money(item.amount, 0);
		return label && amount > 0 ? { label, amount } : null;
	});
	return {
		id: "settings",
		setUp: asBoolean(raw.setUp, false),
		balance: signedMoney(raw.balance),
		balanceAt: asIso(raw.balanceAt) ?? base.balanceAt,
		monthlyCost,
		monthlyIncome: money(raw.monthlyIncome, 0),
		salary: money(raw.salary, 0),
		limits,
		minimum: Array.isArray(raw.minimum) ? minimum.slice(0, 12) : defaultMinimum(limits),
		protect: asBoolean(raw.protect, false),
		savingsTarget: money(raw.savingsTarget, monthlyCost * 6),
		saved: money(raw.saved, 0),
	};
}

export function parseEntry(raw: unknown): Entry | null {
	if (!isRecord(raw)) return null;
	const entryId = id(raw.id);
	const at = asIso(raw.at);
	const amount = money(raw.amount, 0);
	if (!entryId || !at || amount <= 0) return null;
	const kind = raw.kind === "income" ? "income" : "spend";
	const category = kind === "income" ? "other" : oneOf(raw.category, CATEGORIES, "other");
	return {
		id: entryId,
		kind,
		amount,
		category,
		title: text(raw.title, 80) || (kind === "income" ? "Income" : CATEGORY_SHORT[category]),
		note: text(raw.note, 200),
		method: oneOf(raw.method, METHODS, "cash"),
		sourceId: kind === "income" ? id(raw.sourceId) : null,
		clean: kind === "income" ? asBoolean(raw.clean, true) : true,
		purify: kind === "spend" ? asBoolean(raw.purify, false) : false,
		billId: id(raw.billId),
		billMonth: isMonth(raw.billMonth) ? raw.billMonth : null,
		movedFrom:
			category === "dreams" && isLine(raw.movedFrom) && raw.movedFrom !== "dreams"
				? raw.movedFrom
				: null,
		at,
		receiptUri: id(raw.receiptUri),
	};
}

export function parseBill(raw: unknown): Bill | null {
	if (!isRecord(raw)) return null;
	const billId = id(raw.id);
	const name = text(raw.name, 40);
	const amount = money(raw.amount, 0);
	if (!billId || !name || amount <= 0) return null;
	return {
		id: billId,
		name,
		provider: text(raw.provider, 40),
		amount,
		dueDay: Math.min(31, Math.max(1, Math.round(asNumber(raw.dueDay, 1)))),
		category: oneOf(raw.category, CATEGORIES, "bills"),
		paid: asArray(raw.paid, (item) => (isMonth(item) ? item : null)).slice(-24),
		since: isMonth(raw.since) ? raw.since : null,
	};
}

export function parseSource(raw: unknown): Source | null {
	if (!isRecord(raw)) return null;
	const sourceId = id(raw.id);
	const name = text(raw.name, 40);
	if (!sourceId || !name) return null;
	return { id: sourceId, name, note: text(raw.note, 60), halal: asBoolean(raw.halal, true) };
}
