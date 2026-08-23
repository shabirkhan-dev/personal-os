import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';

import { DatabaseService } from '@/database/database.service';
import { routineCompletions, routineItems, routines, userProfiles } from '@/database/schema';

@Injectable()
export class RoutinesRepository {
	constructor(private readonly database: DatabaseService) {}

	async getTimezoneByUserId(userId: string) {
		const [profile] = await this.database.db
			.select({ timezone: userProfiles.timezone })
			.from(userProfiles)
			.where(eq(userProfiles.userId, userId))
			.limit(1);
		return profile?.timezone ?? null;
	}

	async listRoutines(userId: string, includeArchived = false) {
		const conditions = includeArchived
			? eq(routines.userId, userId)
			: and(eq(routines.userId, userId), isNull(routines.archivedAt));
		return this.database.db
			.select()
			.from(routines)
			.where(conditions)
			.orderBy(asc(routines.createdAt));
	}

	async findRoutine(userId: string, routineId: string) {
		const [routine] = await this.database.db
			.select()
			.from(routines)
			.where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
			.limit(1);
		return routine ?? null;
	}

	async insertRoutine(values: typeof routines.$inferInsert) {
		const [routine] = await this.database.db.insert(routines).values(values).returning();
		if (!routine) throw new Error('Routine insert did not return a record');
		return routine;
	}

	async updateRoutine(
		userId: string,
		routineId: string,
		patch: Partial<typeof routines.$inferInsert>,
	) {
		const [routine] = await this.database.db
			.update(routines)
			.set({ ...patch, updatedAt: new Date() })
			.where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
			.returning();
		return routine ?? null;
	}

	async listActiveItems(routineIds: string[]) {
		if (routineIds.length === 0) return [];
		return this.database.db
			.select()
			.from(routineItems)
			.where(and(inArray(routineItems.routineId, routineIds), isNull(routineItems.archivedAt)))
			.orderBy(asc(routineItems.sortOrder), asc(routineItems.createdAt));
	}

	async insertItems(rows: (typeof routineItems.$inferInsert)[]) {
		if (rows.length === 0) return [];
		return this.database.db.insert(routineItems).values(rows).returning();
	}

	async softArchiveItems(routineId: string, userId: string) {
		await this.database.db
			.update(routineItems)
			.set({ archivedAt: new Date(), updatedAt: new Date() })
			.where(
				and(
					eq(routineItems.routineId, routineId),
					eq(routineItems.userId, userId),
					isNull(routineItems.archivedAt),
				),
			);
	}

	async findItem(userId: string, routineId: string, itemId: string) {
		const [item] = await this.database.db
			.select()
			.from(routineItems)
			.where(
				and(
					eq(routineItems.id, itemId),
					eq(routineItems.routineId, routineId),
					eq(routineItems.userId, userId),
					isNull(routineItems.archivedAt),
				),
			)
			.limit(1);
		return item ?? null;
	}

	async listCompletionsForDay(userId: string, completedOn: string) {
		return this.database.db
			.select()
			.from(routineCompletions)
			.where(
				and(eq(routineCompletions.userId, userId), eq(routineCompletions.completedOn, completedOn)),
			);
	}

	async findCompletion(userId: string, itemId: string, completedOn: string) {
		const [completion] = await this.database.db
			.select()
			.from(routineCompletions)
			.where(
				and(
					eq(routineCompletions.userId, userId),
					eq(routineCompletions.itemId, itemId),
					eq(routineCompletions.completedOn, completedOn),
				),
			)
			.limit(1);
		return completion ?? null;
	}

	async insertCompletion(values: typeof routineCompletions.$inferInsert) {
		const [completion] = await this.database.db
			.insert(routineCompletions)
			.values(values)
			.onConflictDoNothing({
				target: [
					routineCompletions.userId,
					routineCompletions.itemId,
					routineCompletions.completedOn,
				],
			})
			.returning();
		return completion ?? null;
	}

	async deleteCompletion(userId: string, itemId: string, completedOn: string) {
		const [deleted] = await this.database.db
			.delete(routineCompletions)
			.where(
				and(
					eq(routineCompletions.userId, userId),
					eq(routineCompletions.itemId, itemId),
					eq(routineCompletions.completedOn, completedOn),
				),
			)
			.returning();
		return deleted ?? null;
	}
}
