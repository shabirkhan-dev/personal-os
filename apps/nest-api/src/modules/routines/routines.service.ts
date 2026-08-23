import { Injectable, NotFoundException } from '@nestjs/common';

import type { NewRoutineRecord } from '@/database/schema';
import type { CreateRoutineInput, ListRoutinesQuery, UpdateRoutineInput } from './routines.dto';
import { RoutinesRepository } from './routines.repository';
import {
	DEFAULT_TIME_ZONE,
	isoWeekdayInTimeZone,
	isScheduledOn,
	localDateInTimeZone,
	normalizeDaysOfWeek,
	parseDaysOfWeek,
} from './routines.schedule';

@Injectable()
export class RoutinesService {
	constructor(private readonly repository: RoutinesRepository) {}

	async create(userId: string, input: CreateRoutineInput) {
		const items = toItemRows(userId, input.items);

		const routine = await this.repository.runInTransaction(async (tx) => {
			const created = await this.repository.insertRoutine(
				{
					userId,
					name: input.name,
					description: input.description ?? null,
					scheduleType: input.scheduleType,
					daysOfWeek:
						input.scheduleType === 'specific_days' && input.daysOfWeek
							? normalizeDaysOfWeek(input.daysOfWeek)
							: null,
				},
				tx,
			);
			if (items.length > 0) {
				await this.repository.insertItems(
					items.map((item) => ({ ...item, routineId: created.id })),
					tx,
				);
			}
			return created;
		});
		return this.getRoutineOrThrow(userId, routine.id);
	}

	async list(userId: string, query: ListRoutinesQuery) {
		const rows = await this.repository.listRoutines(userId, query);
		const items = await this.repository.listActiveItems(rows.map((routine) => routine.id));
		return rows.map((routine) => toRoutineView(routine, items));
	}

	async get(userId: string, routineId: string) {
		return this.getRoutineOrThrow(userId, routineId);
	}

	async update(userId: string, routineId: string, input: UpdateRoutineInput) {
		await this.getRoutineOrThrow(userId, routineId);

		const patch = buildRoutinePatch(input);
		if (patch.requiresExistingDays) {
			const existing = await this.getRoutineOrThrow(userId, routineId);
			if (existing.daysOfWeek.length === 0) {
				throw new NotFoundException(
					'daysOfWeek is required when switching to specific_days without existing days',
				);
			}
		}

		const items = input.items === undefined ? undefined : toItemRows(userId, input.items);

		await this.repository.runInTransaction(async (tx) => {
			if (patch.values && Object.keys(patch.values).length > 0) {
				await this.repository.updateRoutine(userId, routineId, patch.values, tx);
			}
			if (items !== undefined) {
				await this.repository.softArchiveItems(routineId, userId, tx);
				if (items.length > 0) {
					await this.repository.insertItems(
						items.map((item) => ({ ...item, routineId })),
						tx,
					);
				}
			}
		});
		return this.getRoutineOrThrow(userId, routineId);
	}

	async archive(userId: string, routineId: string) {
		await this.getRoutineOrThrow(userId, routineId);
		await this.repository.updateRoutine(userId, routineId, { archivedAt: new Date() });
		return { id: routineId, archived: true };
	}

	async getToday(userId: string, now = new Date()) {
		const timeZone = (await this.repository.getTimezoneByUserId(userId)) ?? DEFAULT_TIME_ZONE;
		const today = localDateInTimeZone(now, timeZone);
		const weekday = isoWeekdayInTimeZone(now, timeZone);

		const allRoutines = await this.repository.listRoutines(userId, { limit: 200, offset: 0 });
		const scheduled = allRoutines.filter((routine) =>
			isScheduledOn(routine.scheduleType, routine.daysOfWeek, weekday),
		);
		const items = await this.repository.listActiveItems(scheduled.map((r) => r.id));
		const completions = await this.repository.listCompletionsForDay(userId, today);
		const completedItemIds = new Set(completions.map((completion) => completion.itemId));

		return {
			date: today,
			timeZone,
			weekday,
			routines: scheduled.map((routine) => toTodayRoutine(routine, items, completedItemIds)),
		};
	}

	async toggleItem(userId: string, routineId: string, itemId: string, now = new Date()) {
		const routine = await this.getRoutineOrThrow(userId, routineId);
		const item = await this.repository.findItem(userId, routineId, itemId);
		if (!item) throw new NotFoundException(`Routine item ${itemId} not found`);

		const timeZone = (await this.repository.getTimezoneByUserId(userId)) ?? DEFAULT_TIME_ZONE;
		const today = localDateInTimeZone(now, timeZone);

		const existing = await this.repository.findCompletion(userId, itemId, today);
		if (existing) {
			await this.repository.deleteCompletion(userId, itemId, today);
			return { itemId, date: today, completed: false };
		}

		await this.repository.insertCompletion({
			userId,
			routineId: routine.id,
			itemId,
			completedOn: today,
		});
		return { itemId, date: today, completed: true };
	}

	private async getRoutineOrThrow(userId: string, routineId: string) {
		const routine = await this.repository.findRoutine(userId, routineId);
		if (!routine) throw new NotFoundException(`Routine ${routineId} not found`);
		const items = await this.repository.listActiveItems([routineId]);
		return toRoutineView(routine, items);
	}
}

type RoutineRow = NonNullable<Awaited<ReturnType<RoutinesRepository['findRoutine']>>>;
type RoutineItemRow = Awaited<ReturnType<RoutinesRepository['listActiveItems']>>[number];

function toItemRows(userId: string, items: CreateRoutineInput['items']) {
	return (items ?? []).map((item, sortOrder) => ({
		userId,
		name: item.name,
		notes: item.notes ?? null,
		targetTime: item.targetTime ?? null,
		sortOrder,
	}));
}

function buildRoutinePatch(input: UpdateRoutineInput): {
	values: Partial<NewRoutineRecord>;
	requiresExistingDays: boolean;
} {
	const values: Partial<NewRoutineRecord> = {};
	let requiresExistingDays = false;

	if (input.name !== undefined) values.name = input.name;
	if (input.description !== undefined) values.description = input.description ?? null;
	if (input.archived !== undefined) values.archivedAt = input.archived ? new Date() : null;

	switch (input.scheduleType) {
		case 'daily':
			values.scheduleType = 'daily';
			values.daysOfWeek = null;
			break;
		case 'specific_days':
			values.scheduleType = 'specific_days';
			if (input.daysOfWeek !== undefined) {
				values.daysOfWeek = normalizeDaysOfWeek(input.daysOfWeek);
			} else if (input.daysOfWeek === undefined) {
				requiresExistingDays = true;
			}
			break;
		default:
			break;
	}

	if (values.scheduleType === undefined && input.daysOfWeek !== undefined) {
		values.daysOfWeek = normalizeDaysOfWeek(input.daysOfWeek);
	}

	return { values, requiresExistingDays };
}

function toTodayRoutine(
	routine: RoutineRow,
	items: RoutineItemRow[],
	completedItemIds: ReadonlySet<string>,
) {
	const routineItemsList = items.filter((item) => item.routineId === routine.id);
	const completedItems = routineItemsList.filter((item) => completedItemIds.has(item.id)).length;
	return {
		id: routine.id,
		name: routine.name,
		description: routine.description,
		completedItems,
		totalItems: routineItemsList.length,
		items: routineItemsList.map((item) => ({
			id: item.id,
			name: item.name,
			targetTime: item.targetTime,
			sortOrder: item.sortOrder,
			completed: completedItemIds.has(item.id),
		})),
	};
}

function toRoutineView(routine: RoutineRow, items: readonly RoutineItemRow[]) {
	return {
		id: routine.id,
		name: routine.name,
		description: routine.description,
		scheduleType: routine.scheduleType,
		daysOfWeek: parseDaysOfWeek(routine.daysOfWeek),
		archivedAt: routine.archivedAt,
		createdAt: routine.createdAt,
		updatedAt: routine.updatedAt,
		items: items
			.filter((item) => item.routineId === routine.id)
			.map((item) => ({
				id: item.id,
				name: item.name,
				notes: item.notes,
				targetTime: item.targetTime,
				sortOrder: item.sortOrder,
			})),
	};
}
