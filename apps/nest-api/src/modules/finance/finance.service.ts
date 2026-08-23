import { Injectable, NotFoundException } from '@nestjs/common';

import { DEFAULT_TIME_ZONE, localDateInTimeZone } from '@/common/time/local-date';
import type { FinanceBudgetRecord, FinanceTransactionRecord } from '@/database/schema';
import type {
	CreateTransactionInput,
	ListTransactionsQuery,
	UpdateTransactionInput,
	UpsertBudgetsInput,
} from './finance.dto';
import { normalizeCategory } from './finance.dto';
import { FinanceRepository } from './finance.repository';

const UNCATEGORIZED = 'uncategorized';

/**
 * Pure month aggregation: totals, per-category expense breakdown, and budget
 * vs actual. Exported for tests; the service only orchestrates.
 */
export function buildMonthSummary(
	transactions: FinanceTransactionRecord[],
	budgets: FinanceBudgetRecord[],
) {
	let incomeTotal = 0;
	let expenseTotal = 0;
	const byCategory = new Map<string, number>();

	for (const transaction of transactions) {
		if (transaction.type === 'income') {
			incomeTotal += transaction.amountMinor;
			continue;
		}
		expenseTotal += transaction.amountMinor;
		const key = transaction.category ?? UNCATEGORIZED;
		byCategory.set(key, (byCategory.get(key) ?? 0) + transaction.amountMinor);
	}

	const categories = new Set<string>([...byCategory.keys(), ...budgets.map((b) => b.category)]);
	return {
		incomeTotal,
		expenseTotal,
		netTotal: incomeTotal - expenseTotal,
		categories: [...categories].sort().map((category) => ({
			category,
			spent: byCategory.get(category) ?? 0,
			limit: budgets.find((budget) => budget.category === category)?.limitMinor ?? null,
		})),
	};
}

@Injectable()
export class FinanceService {
	constructor(private readonly repository: FinanceRepository) {}

	async createTransaction(userId: string, input: CreateTransactionInput, now = new Date()) {
		const occurredOn = input.occurredOn ?? (await this.todayFor(userId, now));
		return this.repository.insertTransaction({
			userId,
			type: input.type,
			amountMinor: input.amountMinor,
			currency: input.currency ?? 'INR',
			category: input.category ? normalizeCategory(input.category) : null,
			note: input.note ?? null,
			occurredOn,
		});
	}

	async listTransactions(userId: string, query: ListTransactionsQuery) {
		return this.repository.listTransactions(
			userId,
			{ limit: query.limit, offset: query.offset },
			{
				type: query.type,
				category: query.category,
				month: query.month,
			},
		);
	}

	async updateTransaction(userId: string, id: string, input: UpdateTransactionInput) {
		await this.getTransactionOrThrow(userId, id);
		const patch: Partial<FinanceTransactionRecord> = {};
		if (input.type !== undefined) patch.type = input.type;
		if (input.amountMinor !== undefined) patch.amountMinor = input.amountMinor;
		if (input.currency !== undefined) patch.currency = input.currency;
		if (input.category !== undefined) {
			patch.category = input.category === null ? null : normalizeCategory(input.category);
		}
		if (input.note !== undefined) patch.note = input.note ?? null;
		if (input.occurredOn !== undefined) patch.occurredOn = input.occurredOn;

		const updated = await this.repository.updateTransaction(userId, id, patch);
		if (!updated) throw new NotFoundException(`Transaction ${id} not found`);
		return updated;
	}

	async deleteTransaction(userId: string, id: string) {
		await this.getTransactionOrThrow(userId, id);
		const deleted = await this.repository.deleteTransaction(userId, id);
		if (!deleted) throw new NotFoundException(`Transaction ${id} not found`);
		return { id, deleted: true };
	}

	async setBudgets(userId: string, month: string, input: UpsertBudgetsInput) {
		const rows = input.budgets.map((entry) => ({
			userId,
			month,
			category: normalizeCategory(entry.category),
			limitMinor: entry.limitMinor,
		}));

		await this.repository.runInTransaction((tx) =>
			this.repository.replaceBudgets(userId, month, rows, tx),
		);
		return this.repository.listBudgets(userId, month);
	}

	async getBudgets(userId: string, month: string) {
		return this.repository.listBudgets(userId, month);
	}

	async getSummary(userId: string, month: string) {
		const [transactions, budgets] = await Promise.all([
			this.repository.listMonthTransactions(userId, month),
			this.repository.listBudgets(userId, month),
		]);

		return { month, ...buildMonthSummary(transactions, budgets) };
	}

	private async getTransactionOrThrow(userId: string, id: string) {
		const row = await this.repository.findTransaction(userId, id);
		if (!row) throw new NotFoundException(`Transaction ${id} not found`);
		return row;
	}

	private async todayFor(userId: string, now: Date) {
		const timeZone = (await this.repository.getTimezoneByUserId(userId)) ?? DEFAULT_TIME_ZONE;
		return localDateInTimeZone(now, timeZone);
	}
}
