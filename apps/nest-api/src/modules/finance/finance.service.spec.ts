import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';

import type { FinanceBudgetRecord, FinanceTransactionRecord } from '@/database/schema';
import { FinanceRepository } from './finance.repository';
import { buildMonthSummary, FinanceService } from './finance.service';

const userId = 'a1111111-1111-4111-8111-111111111111';

function transactionRow(overrides: Partial<FinanceTransactionRecord> = {}) {
	return {
		id: 'b2222222-2222-4222-8222-222222222222',
		userId,
		type: 'expense' as const,
		amountMinor: 10_000,
		currency: 'INR',
		category: 'food',
		note: null,
		occurredOn: '2026-08-01',
		createdAt: new Date('2026-08-01T00:00:00Z'),
		updatedAt: new Date('2026-08-01T00:00:00Z'),
		...overrides,
	};
}

function budgetRow(overrides: Partial<FinanceBudgetRecord> = {}) {
	return {
		id: 'c3333333-3333-4333-8333-333333333333',
		userId,
		month: '2026-08',
		category: 'food',
		limitMinor: 50_000,
		createdAt: new Date('2026-08-01T00:00:00Z'),
		updatedAt: new Date('2026-08-01T00:00:00Z'),
		...overrides,
	};
}

describe('buildMonthSummary', () => {
	it('totals income and expense and nets them', () => {
		const summary = buildMonthSummary(
			[
				transactionRow({
					id: 'b2222222-2222-4222-8222-222222222229',
					type: 'income',
					category: null,
					amountMinor: 100_000,
				}),
				transactionRow({ amountMinor: 25_000 }),
			],
			[],
		);
		expect(summary.incomeTotal).toBe(100_000);
		expect(summary.expenseTotal).toBe(25_000);
		expect(summary.netTotal).toBe(75_000);
	});

	it('breaks expenses down by category with uncategorized fallback', () => {
		const summary = buildMonthSummary(
			[
				transactionRow({ category: 'food', amountMinor: 10_000 }),
				transactionRow({ category: null, amountMinor: 5_000 }),
				transactionRow({ category: 'food', amountMinor: 15_000 }),
			],
			[],
		);
		expect(summary.categories).toEqual([
			{ category: 'food', spent: 25_000, limit: null },
			{ category: 'uncategorized', spent: 5_000, limit: null },
		]);
	});

	it('joins budgets to spend by category even when unspent', () => {
		const summary = buildMonthSummary(
			[transactionRow({ category: 'food', amountMinor: 20_000 })],
			[budgetRow({ category: 'transport', limitMinor: 30_000 })],
		);
		expect(summary.categories).toEqual([
			{ category: 'food', spent: 20_000, limit: null },
			{ category: 'transport', spent: 0, limit: 30_000 },
		]);
	});
});

describe('FinanceService', () => {
	let repository: Mocked<FinanceRepository>;
	let service: FinanceService;
	let existingTransaction: FinanceTransactionRecord | null;

	beforeEach(() => {
		existingTransaction = transactionRow();
		repository = {
			runInTransaction: vi.fn(<T>(work: (tx: unknown) => Promise<T>) => work(undefined)),
			getTimezoneByUserId: vi.fn(async () => 'Asia/Kolkata'),
			listTransactions: vi.fn(async () => []),
			listMonthTransactions: vi.fn(async () => []),
			findTransaction: vi.fn(async () => existingTransaction),
			insertTransaction: vi.fn(async (values) => transactionRow(values)),
			updateTransaction: vi.fn(async (_userId, _id, patch) => transactionRow(patch)),
			deleteTransaction: vi.fn(async () => transactionRow()),
			listBudgets: vi.fn(async () => []),
			replaceBudgets: vi.fn(async () => {}),
		} as unknown as Mocked<FinanceRepository>;
		service = new FinanceService(repository);
	});

	it('defaults occurredOn to today in the user timezone', async () => {
		await service.createTransaction(
			userId,
			{ type: 'expense', amountMinor: 5_000, currency: 'INR' },
			new Date('2026-08-23T20:00:00Z'), // 2026-08-24 in Kolkata
		);
		expect(repository.insertTransaction).toHaveBeenCalledWith(
			expect.objectContaining({
				currency: 'INR',
				occurredOn: '2026-08-24',
				category: null,
			}),
		);
	});

	it('normalizes categories on create', async () => {
		await service.createTransaction(userId, {
			type: 'expense',
			amountMinor: 5_000,
			currency: 'INR',
			category: ' Groceries ',
		});
		expect(repository.insertTransaction).toHaveBeenCalledWith(
			expect.objectContaining({ category: 'groceries' }),
		);
	});

	it('passes list filters through to the repository', async () => {
		await service.listTransactions(userId, {
			limit: 50,
			offset: 10,
			type: 'expense',
			month: '2026-08',
		});
		expect(repository.listTransactions).toHaveBeenCalledWith(
			userId,
			{ limit: 50, offset: 10 },
			{ type: 'expense', category: undefined, month: '2026-08' },
		);
	});

	it('replaces a month budget set inside a transaction', async () => {
		repository.listBudgets.mockResolvedValue([budgetRow()]);
		const result = await service.setBudgets(userId, '2026-08', {
			budgets: [
				{ category: 'Food', limitMinor: 40_000 },
				{ category: 'Transport', limitMinor: 20_000 },
			],
		});

		expect(repository.runInTransaction).toHaveBeenCalledOnce();
		expect(repository.replaceBudgets).toHaveBeenCalledWith(
			userId,
			'2026-08',
			[
				expect.objectContaining({ category: 'food', limitMinor: 40_000 }),
				expect.objectContaining({ category: 'transport', limitMinor: 20_000 }),
			],
			undefined,
		);
		expect(result).toHaveLength(1);
	});

	it('builds the summary from month transactions plus budgets', async () => {
		repository.listMonthTransactions.mockResolvedValue([transactionRow({ amountMinor: 12_000 })]);
		repository.listBudgets.mockResolvedValue([budgetRow()]);

		const summary = await service.getSummary(userId, '2026-08');

		expect(summary.month).toBe('2026-08');
		expect(summary.expenseTotal).toBe(12_000);
		expect(summary.categories).toContainEqual({
			category: 'food',
			spent: 12_000,
			limit: 50_000,
		});
	});

	it('throws when updating a transaction that does not belong to the user', async () => {
		existingTransaction = null;
		await expect(
			service.updateTransaction(userId, 'b2222222-2222-4222-8222-222222222222', {
				note: 'nope',
			}),
		).rejects.toThrow(/not found/i);
	});
});
