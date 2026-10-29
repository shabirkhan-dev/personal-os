import { monthKey, newId } from "../dates";
import { roundCents } from "./math";
import type { Bill, Category, Entry, Method } from "./model";

/**
 * Finance's changes as pure functions, applied alike by the app (saved on the phone) and the
 * assistant (saved on the server).
 */

/** A complete entry from the fields that matter; the rest take their defaults. */
export function newEntry(
	fields: Partial<Entry> & Pick<Entry, "kind" | "amount" | "title">,
	now = new Date(),
	id = newId(),
): Entry {
	return {
		id,
		category: "other",
		note: "",
		method: "cash",
		sourceId: null,
		clean: true,
		purify: false,
		billId: null,
		billMonth: null,
		movedFrom: null,
		at: now.toISOString(),
		receiptUri: null,
		...fields,
		amount: roundCents(fields.amount),
	};
}

/** Money out on a budget line. */
export function spendEntry(
	input: { amount: number; title: string; category: Category; method?: Method; note?: string },
	at: Date,
): Entry {
	return newEntry(
		{
			kind: "spend",
			amount: input.amount,
			title: input.title.trim() || input.category,
			category: input.category,
			method: input.method ?? "cash",
			note: input.note ?? "",
			at: at.toISOString(),
		},
		at,
	);
}

/** "Pay": the bill's spending entry for the month it covers, and that month marked paid. */
export function payBillOps(bill: Bill, due: Date, now = new Date()): { entry: Entry; bill: Bill } {
	const month = monthKey(due);
	return {
		entry: newEntry(
			{
				kind: "spend",
				amount: bill.amount,
				title: bill.name,
				note: bill.provider,
				category: bill.category,
				method: "bank",
				billId: bill.id,
				billMonth: month,
			},
			now,
		),
		bill: { ...bill, paid: [...new Set([...bill.paid, month])] },
	};
}

/** The bill once a payment entry for `month` is deleted: that month is unpaid again. */
export function unpaidBill(bill: Bill, month: string): Bill {
	return { ...bill, paid: bill.paid.filter((key) => key !== month) };
}
