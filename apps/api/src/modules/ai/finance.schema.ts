import * as z from "zod";

/** The Finance AI contract. Requests are strict; model answers are trimmed, not failed. */

export const categories = [
	"food",
	"bills",
	"transport",
	"care",
	"giving",
	"shopping",
	"other",
] as const;
export const methods = ["cash", "bank", "wallet"] as const;

const text = (max: number) =>
	z
		.string()
		.default("")
		.transform((value) => value.trim().slice(0, max));

const line = (max: number) => z.string().trim().max(max);
const rupees = z.number().min(0).max(1_000_000_000);

// --- read -------------------------------------------------------------------------------------

export const readSpendSchema = z
	.object({
		text: z.string().trim().min(1).max(600),
	})
	.strict();

const spendItem = z.object({
	name: text(60).describe("Short and plain: 'Chicken · 1 kg', 'Bike fuel'"),
	amount: z.number().min(0).max(10_000_000).catch(0),
	category: z.enum(categories).catch("other"),
});

export const spendReading = z.object({
	items: z
		.array(spendItem)
		.default([])
		.transform((items) => items.filter((item) => item.name && item.amount > 0).slice(0, 12)),
	method: z.enum(methods).nullable().catch(null),
});

// --- ask --------------------------------------------------------------------------------------

export const askFinanceSchema = z
	.object({
		question: z.string().trim().min(1).max(500),
		today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "The user's local date, YYYY-MM-DD"),
		balance: rupees,
		runwayDays: z.number().int().min(0).max(100_000).nullable(),
		monthlyCost: rupees,
		monthlyIncome: rupees,
		spent: rupees,
		budget: rupees,
		lines: z
			.array(z.object({ name: line(30), spent: rupees, limit: rupees }).strict())
			.max(8)
			.default([]),
		bills: z
			.array(z.object({ name: line(40), amount: rupees, due: line(20) }).strict())
			.max(8)
			.default([]),
		recent: z
			.array(
				z
					.object({
						day: line(10),
						title: line(60),
						amount: rupees,
						kind: z.enum(["spend", "income"]),
					})
					.strict(),
			)
			.max(12)
			.default([]),
	})
	.strict();

export const financeAnswer = z.object({
	answer: text(900),
	followUps: z
		.array(z.string().transform((value) => value.trim().slice(0, 80)))
		.default([])
		.transform((items) => items.filter(Boolean).slice(0, 3)),
});

export type ReadSpendInput = z.infer<typeof readSpendSchema>;
export type SpendReading = z.infer<typeof spendReading>;
export type AskFinanceInput = z.infer<typeof askFinanceSchema>;
export type FinanceAnswer = z.infer<typeof financeAnswer>;
