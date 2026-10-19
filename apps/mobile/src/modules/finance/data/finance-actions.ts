import { listItems, removeItem, saveItem } from "@/lib/db/collection";
import { monthKey, newId } from "@/lib/day";
import { deleteJson, readJson } from "@/lib/storage/json-file";
import { asArray, asNumber, asString, isRecord } from "@/lib/storage/parse";
import { budgetTotal, roundCents } from "../lib/finance-math";
import {
	type Bill,
	type Category,
	CATEGORY_SHORT,
	defaultLimits,
	defaultMinimum,
	defaultSettings,
	type Entry,
	type FinanceSettings,
	type Method,
	type Source,
} from "../lib/finance-model";
import type { SpendItem } from "../lib/parse-finance-line";
import { deleteReceiptPhoto } from "../services/receipt-photo";
import { financeBills, financeEntries, financeSettings, financeSources } from "./collections";

/** Every Finance write. Each saves to the record store, which refreshes the screens and syncs. */

export function saveSettings(settings: FinanceSettings): Promise<void> {
	return saveItem(financeSettings, settings);
}

export type Numbers = {
	balance: number;
	monthlyCost: number;
	monthlyIncome: number;
	salary?: number;
};

/** The empty Home's "Start runway mode": the three numbers, limits split from the month's cost. */
export function setUp(
	settings: FinanceSettings,
	numbers: Numbers,
	now = new Date(),
): Promise<FinanceSettings> {
	const limits =
		budgetTotal(settings.limits) === numbers.monthlyCost
			? settings.limits
			: defaultLimits(numbers.monthlyCost);
	const next: FinanceSettings = {
		...settings,
		setUp: true,
		balance: roundCents(numbers.balance),
		balanceAt: now.toISOString(),
		monthlyCost: roundCents(numbers.monthlyCost),
		monthlyIncome: roundCents(numbers.monthlyIncome),
		salary: roundCents(numbers.salary ?? settings.salary),
		limits,
		minimum: settings.minimum.length > 0 ? settings.minimum : defaultMinimum(limits),
		savingsTarget: settings.saved > 0 ? settings.savingsTarget : numbers.monthlyCost * 6,
	};
	return saveSettings(next).then(() => next);
}

/** Edit numbers: a new balance restarts the count from now; the rest just changes. */
export function updateNumbers(
	settings: FinanceSettings,
	currentBalance: number,
	numbers: Numbers,
	now = new Date(),
): Promise<void> {
	const moved = Math.abs(numbers.balance - currentBalance) >= 0.01;
	return saveSettings({
		...settings,
		setUp: true,
		balance: moved ? roundCents(numbers.balance) : settings.balance,
		balanceAt: moved ? now.toISOString() : settings.balanceAt,
		monthlyCost: roundCents(numbers.monthlyCost),
		monthlyIncome: roundCents(numbers.monthlyIncome),
		salary: roundCents(numbers.salary ?? settings.salary),
	});
}

function entry(fields: Partial<Entry> & Pick<Entry, "kind" | "amount" | "title">): Entry {
	return {
		id: newId(),
		category: "other",
		note: "",
		method: "cash",
		sourceId: null,
		clean: true,
		purify: false,
		billId: null,
		at: new Date().toISOString(),
		receiptUri: null,
		...fields,
		amount: roundCents(fields.amount),
	};
}

/** Log spending, one entry per item. */
export async function logSpend(
	items: readonly SpendItem[],
	method: Method,
	options: { receiptUri?: string | null; at?: Date } = {},
): Promise<Entry[]> {
	const at = (options.at ?? new Date()).toISOString();
	const entries: Entry[] = [];
	for (const [index, item] of items.entries()) {
		entries.push(
			entry({
				kind: "spend",
				amount: item.amount,
				title: item.name,
				category: item.category,
				method,
				at,
				receiptUri: index === 0 ? (options.receiptUri ?? null) : null,
			}),
		);
	}
	await Promise.all(entries.map((item) => saveItem(financeEntries, item)));
	return entries;
}

/** The source with this name, made if it doesn't exist yet. */
export async function ensureSource(name: string, halal = true): Promise<Source> {
	const clean = name.trim().slice(0, 40) || "Other income";
	const existing = (await listItems(financeSources)).find(
		(source) => source.name.toLowerCase() === clean.toLowerCase(),
	);
	if (existing) return existing;
	const source: Source = { id: newId(), name: clean, note: "", halal };
	await saveItem(financeSources, source);
	return source;
}

export function saveSource(source: Source): Promise<void> {
	return saveItem(financeSources, source);
}

export async function deleteSource(source: Source): Promise<void> {
	await removeItem(financeSources, source.id);
}

export async function logIncome(input: {
	amount: number;
	title: string;
	source: Source | null;
	clean: boolean;
	method?: Method;
	at?: Date;
}): Promise<Entry> {
	const item = entry({
		kind: "income",
		amount: input.amount,
		title: input.title.trim() || input.source?.name || "Income",
		sourceId: input.source?.id ?? null,
		clean: input.clean && (input.source?.halal ?? true),
		note: input.source ? input.source.name : "",
		method: input.method ?? "bank",
		at: (input.at ?? new Date()).toISOString(),
	});
	await saveItem(financeEntries, item);
	return item;
}

export function updateEntry(item: Entry): Promise<void> {
	return saveItem(financeEntries, item);
}

/** Delete an entry; a paid bill goes back to unpaid for that month. */
export async function deleteEntry(item: Entry): Promise<void> {
	await removeItem(financeEntries, item.id);
	if (item.receiptUri) deleteReceiptPhoto(item.receiptUri);
	if (item.billId) {
		const bill = (await listItems(financeBills)).find((each) => each.id === item.billId);
		const month = monthKey(new Date(item.at));
		if (bill)
			await saveItem(financeBills, { ...bill, paid: bill.paid.filter((key) => key !== month) });
	}
}

export async function deleteEntries(items: readonly Entry[]): Promise<void> {
	await Promise.all(items.map((item) => deleteEntry(item)));
}

export function saveBill(bill: Bill): Promise<void> {
	return saveItem(financeBills, bill);
}

export function newBill(fields: Omit<Bill, "id" | "paid" | "since">, now = new Date()): Bill {
	return { ...fields, id: newId(), paid: [], since: monthKey(now) };
}

export async function deleteBill(bill: Bill): Promise<void> {
	await removeItem(financeBills, bill.id);
}

/** "Pay Rs 2,400": a spending entry for the bill and the month marked paid. */
export async function payBill(bill: Bill, due: Date, now = new Date()): Promise<Entry> {
	const item = entry({
		kind: "spend",
		amount: bill.amount,
		title: bill.name,
		note: bill.provider,
		category: bill.category,
		method: "bank",
		billId: bill.id,
		at: now.toISOString(),
	});
	await saveItem(financeEntries, item);
	await saveItem(financeBills, { ...bill, paid: [...new Set([...bill.paid, monthKey(due)])] });
	return item;
}

/** Interest given away: out of the balance, but not counted as charity. */
export async function giveAwayInterest(amount: number): Promise<Entry> {
	const item = entry({
		kind: "spend",
		amount,
		title: "Interest given away",
		note: "not counted as sadqa",
		category: "giving",
		method: "bank",
		purify: true,
	});
	await saveItem(financeEntries, item);
	return item;
}

export function addSavings(settings: FinanceSettings, amount: number): Promise<void> {
	return saveSettings({ ...settings, saved: roundCents(Math.max(0, settings.saved + amount)) });
}

export function saveLimits(settings: FinanceSettings, limits: Record<Category, number>) {
	return saveSettings({ ...settings, limits });
}

/** "Move money": take from one budget line and give to another. */
export function moveMoney(
	settings: FinanceSettings,
	from: Category,
	to: Category,
	amount: number,
): Promise<void> {
	const moved = Math.min(amount, settings.limits[from]);
	return saveLimits(settings, {
		...settings.limits,
		[from]: roundCents(settings.limits[from] - moved),
		[to]: roundCents(settings.limits[to] + moved),
	});
}

/**
 * Wishlist's "Add savings". The money comes from the budget, as a category transfer: `amount`
 * moves from line `from` into Dreams (so `from` has less left to spend this month), and a Dreams
 * entry takes it out of money now, the way cash put in an envelope leaves the wallet. Returns the
 * entry so the transfer can be undone.
 */
export async function fundDream(
	input: { amount: number; from: Category; dream: string },
	now = new Date(),
): Promise<Entry> {
	if (input.from === "dreams") throw new Error("Pick a budget line other than Dreams.");
	const settings = await currentSettings();
	const amount = roundCents(Math.min(input.amount, settings.limits[input.from]));
	if (amount <= 0) throw new Error("That budget line has nothing left to move.");
	await moveMoney(settings, input.from, "dreams", amount);
	const item = entry({
		kind: "spend",
		amount,
		title: `Saved for ${input.dream.trim().slice(0, 60) || "a dream"}`,
		note: `Wishlist · from ${CATEGORY_SHORT[input.from]}`,
		category: "dreams",
		method: "bank",
		at: now.toISOString(),
	});
	await saveItem(financeEntries, item);
	return item;
}

/** Undo a `fundDream`: the entry goes and the amount returns to the line it came from. */
export async function unfundDream(input: {
	entryId: string;
	amount: number;
	from: Category;
}): Promise<void> {
	const item = (await listItems(financeEntries)).find((each) => each.id === input.entryId);
	if (item) await removeItem(financeEntries, item.id);
	await moveMoney(await currentSettings(), "dreams", input.from, input.amount);
}

/** The saved settings, read fresh so back-to-back transfers each see the last one's limits. */
async function currentSettings(): Promise<FinanceSettings> {
	return (await listItems(financeSettings))[0] ?? defaultSettings();
}

// --- the old Finance file -----------------------------------------------------------------------

const OLD_CATEGORIES: Record<string, Category> = {
	food: "food",
	shopping: "shopping",
	transport: "transport",
	bills: "bills",
	other: "other",
};

/**
 * Moves the first Finance's "finance" file (expenses, budget, savings goal) into the record
 * store once, then deletes it. Runway numbers still come from the person.
 */
export async function migrateOldFinance(): Promise<number> {
	const raw = await readJson("finance");
	if (!isRecord(raw)) return 0;
	const existing = new Set((await listItems(financeEntries)).map((item) => item.id));
	const entries = asArray(raw.expenses, (item): Entry | null => {
		if (!isRecord(item)) return null;
		const id = asString(item.id, "");
		const at = asString(item.date, "");
		const amount = asNumber(item.amount, 0);
		if (!id || existing.has(id) || Number.isNaN(Date.parse(at)) || amount <= 0) return null;
		const category = OLD_CATEGORIES[asString(item.category, "other")] ?? "other";
		const receipt = asString(item.receiptUri, "");
		return {
			id,
			kind: "spend",
			amount: roundCents(amount),
			category,
			title: asString(item.note, "").trim().slice(0, 80) || CATEGORY_SHORT[category],
			note: "",
			method: "cash",
			sourceId: null,
			clean: true,
			purify: false,
			billId: null,
			at,
			receiptUri: receipt || null,
		};
	});
	await Promise.all(entries.map((item) => saveItem(financeEntries, item)));
	if ((await listItems(financeSettings)).length === 0) {
		const base = defaultSettings();
		const budget = asNumber(raw.budget, 0);
		const goal = isRecord(raw.goal) ? raw.goal : null;
		const target = goal ? asNumber(goal.target, 0) : 0;
		const saved = goal
			? asArray(goal.contributions, (item) =>
					isRecord(item) ? Math.max(0, asNumber(item.amount, 0)) : null,
				).reduce((sum, value) => sum + value, 0)
			: 0;
		const monthly = budget > 0 ? budget : base.monthlyCost;
		const limits = defaultLimits(monthly);
		if (budget > 0 || target > 0 || entries.length > 0) {
			await saveSettings({
				...base,
				monthlyCost: monthly,
				limits,
				minimum: defaultMinimum(limits),
				savingsTarget: target > 0 ? target : monthly * 6,
				saved: roundCents(saved),
			});
		}
	}
	await deleteJson("finance");
	return entries.length;
}
