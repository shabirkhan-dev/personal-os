import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, lt, type SQL } from 'drizzle-orm';

import { type Database, DatabaseService } from '@/database/database.service';
import {
	financeBudgets,
	financeTransactions,
	type NewFinanceTransactionRecord,
	userProfiles,
} from '@/database/schema';

export interface TransactionFilters {
	type?: 'expense' | 'income';
	category?: string;
	month?: string;
}

@Injectable()
export class FinanceRepository {
	constructor(private readonly database: DatabaseService) {}

	private executor(tx?: Database): Database {
		return tx ?? this.database.db;
	}

	runInTransaction<T>(work: (tx: Database) => Promise<T>): Promise<T> {
		return this.database.transaction(work);
	}

	async getTimezoneByUserId(userId: string) {
		const [profile] = await this.database.db
			.select({ timezone: userProfiles.timezone })
			.from(userProfiles)
			.where(eq(userProfiles.userId, userId))
			.limit(1);
		return profile?.timezone ?? null;
	}

	async listTransactions(
		userId: string,
		pagination: { limit: number; offset: number },
		filters: TransactionFilters,
	) {
		const conditions: (SQL | undefined)[] = [eq(financeTransactions.userId, userId)];
		if (filters.type) conditions.push(eq(financeTransactions.type, filters.type));
		if (filters.category) conditions.push(eq(financeTransactions.category, filters.category));
		if (filters.month) conditions.push(this.monthCondition(filters.month));

		return this.database.db
			.select()
			.from(financeTransactions)
			.where(combineConditions(conditions))
			.orderBy(desc(financeTransactions.occurredOn), desc(financeTransactions.createdAt))
			.limit(pagination.limit)
			.offset(pagination.offset);
	}

	async listMonthTransactions(userId: string, month: string) {
		return this.database.db
			.select()
			.from(financeTransactions)
			.where(
				combineConditions([eq(financeTransactions.userId, userId), this.monthCondition(month)]),
			)
			.orderBy(asc(financeTransactions.occurredOn));
	}

	async findTransaction(userId: string, transactionId: string) {
		const [row] = await this.database.db
			.select()
			.from(financeTransactions)
			.where(and(eq(financeTransactions.id, transactionId), eq(financeTransactions.userId, userId)))
			.limit(1);
		return row ?? null;
	}

	async insertTransaction(values: NewFinanceTransactionRecord, tx?: Database) {
		const [row] = await this.executor(tx).insert(financeTransactions).values(values).returning();
		if (!row) throw new Error('Transaction insert did not return a record');
		return row;
	}

	async updateTransaction(
		userId: string,
		transactionId: string,
		patch: Partial<NewFinanceTransactionRecord>,
	) {
		const [row] = await this.database.db
			.update(financeTransactions)
			.set({ ...patch, updatedAt: new Date() })
			.where(and(eq(financeTransactions.id, transactionId), eq(financeTransactions.userId, userId)))
			.returning();
		return row ?? null;
	}

	async deleteTransaction(userId: string, transactionId: string) {
		const [deleted] = await this.database.db
			.delete(financeTransactions)
			.where(and(eq(financeTransactions.id, transactionId), eq(financeTransactions.userId, userId)))
			.returning();
		return deleted ?? null;
	}

	async listBudgets(userId: string, month: string) {
		return this.database.db
			.select()
			.from(financeBudgets)
			.where(and(eq(financeBudgets.userId, userId), eq(financeBudgets.month, month)))
			.orderBy(asc(financeBudgets.category));
	}

	async replaceBudgets(
		userId: string,
		month: string,
		rows: (typeof financeBudgets.$inferInsert)[],
		tx?: Database,
	) {
		const db = this.executor(tx);
		await db
			.delete(financeBudgets)
			.where(and(eq(financeBudgets.userId, userId), eq(financeBudgets.month, month)));
		if (rows.length > 0) {
			await db.insert(financeBudgets).values(rows);
		}
	}

	private monthCondition(month: string): SQL | undefined {
		// occurredOn is YYYY-MM-DD; a half-open range selects the whole month.
		return and(
			gte(financeTransactions.occurredOn, `${month}-01`),
			lt(financeTransactions.occurredOn, monthNextStart(month)),
		);
	}
}

function combineConditions(conditions: (SQL | undefined)[]): SQL {
	const joined = and(...conditions);
	if (!joined) throw new Error('At least one query condition is required');
	return joined;
}

function monthNextStart(month: string): string {
	const [yearStr, monthStr] = month.split('-');
	const year = Number.parseInt(yearStr, 10);
	const parsedMonth = Number.parseInt(monthStr, 10);
	const nextYear = parsedMonth === 12 ? year + 1 : year;
	const nextMonth = parsedMonth === 12 ? 1 : parsedMonth + 1;
	return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
}
