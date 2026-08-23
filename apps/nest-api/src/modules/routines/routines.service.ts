import { Injectable, NotFoundException } from '@nestjs/common';

import type { NewRoutineItemRecord, NewRoutineRecord } from '@/database/schema';
import type { CreateRoutineInput, UpdateRoutineInput } from './routines.dto';
import { RoutinesRepository } from './routines.repository';

export const DEFAULT_TIME_ZONE = 'UTC';

/** Returns the calendar date (YYYY-MM-DD) in the given IANA time zone. */
export function localDateInTimeZone(date: Date, timeZone: string): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
}

/** Returns the ISO weekday number (1 = Monday .. 7 = Sunday) in the given time zone. */
export function isoWeekdayInTimeZone(date: Date, timeZone: string): number {
	const shortWeekday = new Intl.DateTimeFormat('en-US', {
		timeZone,
		weekday: 'short',
	}).format(date);
	const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const index = order.indexOf(shortWeekday);
	if (index < 0) throw new Error(`Unexpected weekday token: ${shortWeekday}`);
	return index + 1;
}

/** Pure schedule matcher: does this routine run on the given ISO weekday? */
export function isScheduledOn(
	scheduleType: string,
	daysOfWeek: string | null,
	weekday: number,
): boolean {
	if (scheduleType === 'daily') return true;
	if (!daysOfWeek) return false;
	return parseDaysOfWeek(daysOfWeek).includes(weekday);
}

function normalizeDaysOfWeek(daysOfWeek: number[]): string {
	return [...new Set(daysOfWeek)].sort((a, b) => a - b).join(',');
}

function parseDaysOfWeek(daysOfWeek: string | null): number[] {
	if (!daysOfWeek) return [];
	return daysOfWeek
		.split(',')
		.map((token) => Number.parseInt(token.trim(), 10))
		.filter((value) => Number.isInteger(value));
}

@Injectable()
export class RoutinesService {
	constructor(private readonly repository: RoutinesRepository) {}

	async create(userId: string, input: CreateRoutineInput) {
		const routine = await this.repository.insertRoutine({
			userId,
			name: input.name,
			description: input.description ?? null,
			scheduleType: input.scheduleType,
			daysOfWeek:
				input.scheduleType === 'specific_days' && input.daysOfWeek
					? normalizeDaysOfWeek(input.daysOfWeek)
					: null,
		});

		if (input.items && input.items.length > 0) {
			await this.repository.insertItems(toItemRows(routine.id, userId, input.items));
		}
		return this.getRoutineOrThrow(userId, routine.id);
	}

	async list(userId: string) {
		const rows = await this.repository.listRoutines(userId);
		const items = await this.repository.listActiveItems(rows.map((routine) => routine.id));
		return rows.map((routine) => toRoutineView(routine, items));
	}

	async get(userId: string, routineId: string) {
		return this.getRoutineOrThrow(userId, routineId);
	}

	async update(userId: string, routineId: string, input: UpdateRoutineInput) {
		await this.getRoutineOrThrow(userId, routineId);

		const patch: Partial<NewRoutineRecord> = {};
		if (input.name !== undefined) patch.name = input.name;
		if (input.description !== undefined) patch.description = input.description ?? null;

		const scheduleChangedToDaily = input.scheduleType === 'daily' && input.daysOfWeek === undefined;

		if (input.daysOfWeek !== undefined && input.daysOfWeek !== null) {
			patch.daysOfWeek = normalizeDaysOfWeek(input.daysOfWeek);
		} else if (scheduleChangedToDaily || input.scheduleType === 'daily') {
			patch.daysOfWeek = null;
		}
		if (input.scheduleType !== undefined) {
			patch.scheduleType = input.scheduleType;
			if (
				input.scheduleType === 'specific_days' &&
				patch.daysOfWeek === undefined &&
				input.daysOfWeek === undefined
			) {
				const existing = await this.repository.findRoutine(userId, routineId);
				if (!existing?.daysOfWeek) {
					throw new NotFoundException(
						'daysOfWeek is required when switching to specific_days without existing days',
					);
				}
			}
		}

		if (input.archived !== undefined) {
			patch.archivedAt = input.archived ? new Date() : null;
		}

		if (Object.keys(patch).length > 0) {
			await this.repository.updateRoutine(userId, routineId, patch);
		}

		if (input.items !== undefined) {
			await this.repository.softArchiveItems(routineId, userId);
			await this.repository.insertItems(toItemRows(routineId, userId, input.items));
		}
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

		const allRoutines = await this.repository.listRoutines(userId);
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
			routines: scheduled.map((routine) => {
				const routineItemsList = items.filter((item) => item.routineId === routine.id);
				const completedItems = routineItemsList.filter((item) =>
					completedItemIds.has(item.id),
				).length;
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
			}),
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

type RoutineRow = Awaited<ReturnType<RoutinesRepository['findRoutine']>>;
type RoutineItemRow = Awaited<ReturnType<RoutinesRepository['findItem']>>;

function toItemRows(
	routineId: string,
	userId: string,
	items: CreateRoutineInput['items'],
): NewRoutineItemRecord[] {
	return (items ?? []).map((item, sortOrder) => ({
		routineId,
		userId,
		name: item.name,
		notes: item.notes ?? null,
		targetTime: item.targetTime ?? null,
		sortOrder,
	}));
}

function toRoutineView(routine: NonNullable<RoutineRow>, items: RoutineItemRow[]) {
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
