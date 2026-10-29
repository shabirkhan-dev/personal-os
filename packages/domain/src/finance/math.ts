import { monthKey, dayKey, startOfDay } from "../dates";
import { type Bill, CATEGORIES, type Category, type Entry, type FinanceSettings } from "./model";

/**
 * Finance's numbers: balance, runway, budget lines, pace and bills. Pure functions of the records,
 * so the app and the assistant always agree.
 */

/** A month counted as 30 days, so a monthly cost becomes a daily burn. */
export const MONTH_DAYS = 30;

export function roundCents(value: number): number {
	return Math.round(value * 100) / 100;
}

export function total(items: readonly { amount: number }[]): number {
	let sum = 0;
	for (const item of items) sum += item.amount;
	return roundCents(sum);
}

export const spends = (entries: readonly Entry[]) =>
	entries.filter((entry) => entry.kind === "spend");

export const incomes = (entries: readonly Entry[]) =>
	entries.filter((entry) => entry.kind === "income");

/** Entries in the month `offset` months from `now` (0 this month, -1 last month). */
export function inMonth(entries: readonly Entry[], now: Date, offset = 0): Entry[] {
	const key = monthKey(new Date(now.getFullYear(), now.getMonth() + offset, 1));
	return entries.filter((entry) => monthKey(new Date(entry.at)) === key);
}

export function inYear(entries: readonly Entry[], now: Date): Entry[] {
	const year = now.getFullYear();
	return entries.filter((entry) => new Date(entry.at).getFullYear() === year);
}

export function onDay(entries: readonly Entry[], day: Date): Entry[] {
	const key = dayKey(day);
	return entries.filter((entry) => dayKey(new Date(entry.at)) === key);
}

export function byCategory(entries: readonly Entry[]): Record<Category, number> {
	const sums = {} as Record<Category, number>;
	for (const category of CATEGORIES) sums[category] = 0;
	for (const entry of spends(entries)) sums[entry.category] += entry.amount;
	for (const category of CATEGORIES) sums[category] = roundCents(sums[category]);
	return sums;
}

/** Money on hand: what was set, plus income and minus spending since then. */
export function balanceNow(settings: FinanceSettings, entries: readonly Entry[]): number {
	const since = Date.parse(settings.balanceAt);
	let balance = settings.balance;
	for (const entry of entries) {
		if (Date.parse(entry.at) <= since) continue;
		balance += entry.kind === "income" ? entry.amount : -entry.amount;
	}
	return roundCents(balance);
}

export const minimumTotal = (settings: FinanceSettings) => total(settings.minimum);

export const budgetTotal = (limits: Record<Category, number>) =>
	roundCents(CATEGORIES.reduce((sum, category) => sum + limits[category], 0));

/** What a month costs for the runway: the minimum while it is protected. */
export function monthlyCost(settings: FinanceSettings): number {
	return settings.protect ? minimumTotal(settings) : settings.monthlyCost;
}

/** Monthly burn after fixed income; 0 when income covers the month. */
export function monthlyBurn(settings: FinanceSettings, cut = 0): number {
	return Math.max(0, monthlyCost(settings) - cut - settings.monthlyIncome);
}

/** Whole days the money lasts; null when nothing is burning. */
export function runwayDays(balance: number, burn: number): number | null {
	if (burn <= 0) return null;
	return Math.max(0, Math.floor(balance / (burn / MONTH_DAYS)));
}

export function daysInMonth(date: Date): number {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export type Pace = {
	spent: number;
	budget: number;
	spentShare: number;
	monthShare: number;
	state: "on track" | "ahead" | "over";
	daysLeft: number;
	perDay: number;
};

/** This month's spending against the budget and how far through the month we are. */
export function pace(spent: number, budget: number, now: Date): Pace {
	const days = daysInMonth(now);
	const daysLeft = days - now.getDate() + 1;
	const monthShare = (now.getDate() - 1 + now.getHours() / 24) / days;
	const spentShare = budget > 0 ? spent / budget : 0;
	const state =
		budget > 0 && spent > budget
			? "over"
			: spentShare > monthShare + 0.1
				? "ahead"
				: ("on track" as const);
	return {
		spent,
		budget,
		spentShare,
		monthShare,
		state,
		daysLeft,
		perDay: daysLeft > 0 ? Math.max(0, (budget - spent) / daysLeft) : 0,
	};
}

export function dueIn(bill: Bill, year: number, month: number): Date {
	const last = new Date(year, month + 1, 0).getDate();
	return new Date(year, month, Math.min(bill.dueDay, last));
}

export type DueBill = { bill: Bill; due: Date; overdue: boolean };

/** The month a bill's history starts: when it was added, else its first paid month. */
function billStart(bill: Bill): string | null {
	return bill.since ?? ([...bill.paid].sort()[0] || null);
}

/**
 * Bills not paid yet, soonest first. Last month's occurrence stays, overdue, until it is paid (a
 * bill due 28 Oct still shows on 1 Nov); otherwise this month's if unpaid, else next month's.
 */
export function upcomingBills(bills: readonly Bill[], now: Date): DueBill[] {
	const today = startOfDay(now);
	const year = now.getFullYear();
	const month = now.getMonth();
	const thisMonth = monthKey(now);
	const lastMonth = monthKey(new Date(year, month - 1, 1));
	return bills
		.map((bill) => {
			const start = billStart(bill);
			if (start !== null && start <= lastMonth && !bill.paid.includes(lastMonth)) {
				return { bill, due: dueIn(bill, year, month - 1), overdue: true };
			}
			const due = dueIn(bill, year, month);
			if (!bill.paid.includes(thisMonth)) return { bill, due, overdue: due < today };
			return { bill, due: dueIn(bill, year, month + 1), overdue: false };
		})
		.sort((a, b) => a.due.getTime() - b.due.getTime());
}

/** The "YYYY-MM" a bill payment covered: stored on the entry, else (older entries) its month. */
export function billMonthOf(entry: Pick<Entry, "billMonth" | "at">): string {
	return entry.billMonth ?? monthKey(new Date(entry.at));
}

/**
 * Each budget line's limit for the month of `now`: the standing limits, with that month's Wishlist
 * transfers (Dreams entries with `movedFrom`) taken from their line and given to Dreams. A transfer
 * never carries into the next month, and deleting its entry puts the money back.
 */
export function monthLimits(
	settings: FinanceSettings,
	entries: readonly Entry[],
	now: Date,
): Record<Category, number> {
	const limits = { ...settings.limits };
	for (const entry of spends(inMonth(entries, now))) {
		const from = entry.category === "dreams" ? entry.movedFrom : null;
		if (!from || from === "dreams") continue;
		const moved = Math.min(entry.amount, limits[from]);
		limits[from] = roundCents(limits[from] - moved);
		limits.dreams = roundCents(limits.dreams + moved);
	}
	return limits;
}

/** What is still free on each budget line this month: its limit minus what was spent on it. */
export function lineRoom(
	settings: FinanceSettings,
	entries: readonly Entry[],
	now: Date,
): Record<Category, number> {
	const month = inMonth(entries, now);
	const limits = monthLimits(settings, month, now);
	const spent = byCategory(month);
	const room = {} as Record<Category, number>;
	for (const category of CATEGORIES) {
		room[category] = roundCents(Math.max(0, limits[category] - spent[category]));
	}
	return room;
}
