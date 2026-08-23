import * as z from 'zod';

import { makePaginationSchema } from '@/common/schemas/pagination';

export const FINANCE_TRANSACTION_TYPES = ['expense', 'income'] as const;

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected month as YYYY-MM');

export const financeMonthSchema = monthSchema;

const calendarDateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date as YYYY-MM-DD')
	.refine((value) => {
		const [year, month, day] = value.split('-').map(Number);
		const parsed = new Date(Date.UTC(year, month - 1, day));
		return (
			parsed.getUTCFullYear() === year &&
			parsed.getUTCMonth() === month - 1 &&
			parsed.getUTCDate() === day
		);
	}, 'Not a real calendar date')
	.refine(
		(value) => value >= '2000-01-01' && value <= '2100-12-31',
		'Date must be between 2000 and 2100',
	);

const categorySchema = z
	.string()
	.trim()
	.toLowerCase()
	.min(1)
	.max(64)
	.regex(/^[a-z0-9][a-z0-9 _-]*$/);

/** Server-side normalization: categories group consistently regardless of client casing. */
export const normalizeCategory = (category: string) => category.trim().toLowerCase();

export const createTransactionSchema = z
	.object({
		type: z.enum(FINANCE_TRANSACTION_TYPES),
		amountMinor: z.number().int().min(1).max(1_000_000_000_000),
		currency: z
			.string()
			.regex(/^[A-Z]{3}$/)
			.default('INR'),
		category: categorySchema.nullable().optional(),
		note: z.string().trim().max(280).nullable().optional(),
		occurredOn: calendarDateSchema.optional(),
	})
	.strict();

export const updateTransactionSchema = z
	.object({
		type: z.enum(FINANCE_TRANSACTION_TYPES).optional(),
		amountMinor: z.number().int().min(1).max(1_000_000_000_000).optional(),
		currency: z
			.string()
			.regex(/^[A-Z]{3}$/)
			.optional(),
		category: categorySchema.nullable().optional(),
		note: z.string().trim().max(280).nullable().optional(),
		occurredOn: calendarDateSchema.optional(),
	})
	.strict()
	.refine((input) => Object.keys(input).length > 0, 'At least one field is required');

export const listTransactionsQuerySchema = makePaginationSchema().extend({
	type: z.enum(FINANCE_TRANSACTION_TYPES).optional(),
	category: categorySchema.optional(),
	month: monthSchema.optional(),
});

export const upsertBudgetsSchema = z
	.object({
		budgets: z
			.array(
				z.object({
					category: categorySchema,
					limitMinor: z.number().int().min(0).max(1_000_000_000_000),
				}),
			)
			.min(1)
			.max(50),
	})
	.strict();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type UpsertBudgetsInput = z.infer<typeof upsertBudgetsSchema>;

/** Carries the Zod schema for the global validation pipe. */
export class CreateTransactionDto implements CreateTransactionInput {
	static schema = createTransactionSchema;
	type!: CreateTransactionInput['type'];
	amountMinor!: number;
	currency!: string;
	category?: string | null;
	note?: string | null;
	occurredOn?: string;
}

export class UpdateTransactionDto implements UpdateTransactionInput {
	static schema = updateTransactionSchema;
	type?: UpdateTransactionInput['type'];
	amountMinor?: number;
	currency?: string;
	category?: string | null;
	note?: string | null;
	occurredOn?: string;
}

export class ListTransactionsQueryDto {
	static schema = listTransactionsQuerySchema;
	limit!: number;
	offset!: number;
	type?: ListTransactionsQuery['type'];
	category?: string;
	month?: string;
}

export class UpsertBudgetsDto implements UpsertBudgetsInput {
	static schema = upsertBudgetsSchema;
	budgets!: UpsertBudgetsInput['budgets'];
}
