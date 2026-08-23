import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';

import type { NewRoutineItemRecord, RoutineRecord } from '@/database/schema';
import { RoutinesRepository } from './routines.repository';
import {
	isoWeekdayInTimeZone,
	isScheduledOn,
	localDateInTimeZone,
	RoutinesService,
} from './routines.service';

const userId = '11111111-1111-1111-1111-111111111111';

function routineRow() {
	return {
		id: '22222222-2222-2222-2222-222222222222',
		userId,
		name: 'Morning routine',
		description: null,
		scheduleType: 'daily' as const,
		daysOfWeek: null,
		archivedAt: null,
		createdAt: new Date('2026-01-01T00:00:00Z'),
		updatedAt: new Date('2026-01-01T00:00:00Z'),
	};
}

function itemRow(overrides: { id?: string; name?: string; sortOrder?: number }) {
	return {
		id: overrides.id ?? `33333333-3333-3333-3333-3333333333${overrides.sortOrder ?? 0}`,
		routineId: '22222222-2222-2222-2222-222222222222',
		userId,
		name: overrides.name ?? 'Drink water',
		notes: null,
		targetTime: null,
		sortOrder: overrides.sortOrder ?? 0,
		archivedAt: null,
		createdAt: new Date('2026-01-01T00:00:00Z'),
		updatedAt: new Date('2026-01-01T00:00:00Z'),
	};
}

describe('routine date helpers', () => {
	it('computes the local calendar date in a time zone', () => {
		const utcEvening = new Date('2026-08-23T20:00:00Z');
		expect(localDateInTimeZone(utcEvening, 'UTC')).toBe('2026-08-23');
		expect(localDateInTimeZone(utcEvening, 'Asia/Kolkata')).toBe('2026-08-24');
	});

	it('computes ISO weekdays in a time zone', () => {
		const sundayEveningUtc = new Date('2026-08-23T20:00:00Z'); // Sunday 20:00 UTC = Monday 01:30 IST
		expect(isoWeekdayInTimeZone(sundayEveningUtc, 'UTC')).toBe(7);
		expect(isoWeekdayInTimeZone(sundayEveningUtc, 'Asia/Kolkata')).toBe(1);
	});
});

describe('isScheduledOn', () => {
	it('matches daily routines on any weekday', () => {
		expect(isScheduledOn('daily', null, 1)).toBe(true);
		expect(isScheduledOn('daily', '1,3', 7)).toBe(true);
	});

	it('matches specific_days by ISO weekday set', () => {
		expect(isScheduledOn('specific_days', '1,3,5', 3)).toBe(true);
		expect(isScheduledOn('specific_days', '1,3,5', 2)).toBe(false);
	});

	it('never matches specific_days with missing days config', () => {
		expect(isScheduledOn('specific_days', null, 1)).toBe(false);
	});
});

describe('RoutinesService', () => {
	let repository: Mocked<RoutinesRepository>;
	let service: RoutinesService;
	let existingRoutine: RoutineRecord | null;

	beforeEach(() => {
		existingRoutine = routineRow();
		repository = {
			getTimezoneByUserId: vi.fn(async () => null),
			listRoutines: vi.fn(async () => []),
			findRoutine: vi.fn(async () => existingRoutine),
			insertRoutine: vi.fn(async (values) => ({
				...routineRow(),
				name: values.name ?? 'Morning routine',
				scheduleType: values.scheduleType ?? 'daily',
				daysOfWeek: values.daysOfWeek ?? null,
			})),
			updateRoutine: vi.fn(async (_userId, _id, patch) => ({
				...routineRow(),
				...patch,
			})),
			listActiveItems: vi.fn(async () => [itemRow({}), itemRow({ sortOrder: 1, name: 'Stretch' })]),
			insertItems: vi.fn(async (rows: NewRoutineItemRecord[]) =>
				rows.map((_row, index: number) => itemRow({ sortOrder: index })),
			),
			softArchiveItems: vi.fn(async () => {}),
			findItem: vi.fn(async () => itemRow({})),
			listCompletionsForDay: vi.fn(async () => []),
			findCompletion: vi.fn(async () => null),
			insertCompletion: vi.fn(async (values) => ({
				id: '44444444-4444-4444-4444-444444444444',
				completedAt: new Date(),
				...values,
			})),
			deleteCompletion: vi.fn(async () => ({
				id: '44444444-4444-4444-4444-444444444444',
				userId,
				routineId: '22222222-2222-2222-2222-222222222222',
				itemId: '33333333-3333-3333-3333-333333333330',
				completedOn: '2026-08-23',
				completedAt: new Date(),
			})),
		} as unknown as Mocked<RoutinesRepository>;
		service = new RoutinesService(repository);
	});

	it('creates a routine and its items in order', async () => {
		const result = await service.create(userId, {
			name: 'Evening routine',
			scheduleType: 'specific_days',
			daysOfWeek: [5, 1],
			items: [{ name: 'Read' }, { name: 'Plan tomorrow' }],
		});

		expect(repository.insertRoutine).toHaveBeenCalledWith(
			expect.objectContaining({
				name: 'Evening routine',
				scheduleType: 'specific_days',
				daysOfWeek: '1,5',
			}),
		);
		expect(result.items.map((item) => item.sortOrder)).toEqual([0, 1]);
	});

	it('lists routines with their items grouped', async () => {
		repository.listRoutines.mockResolvedValue([routineRow()]);
		const result = await service.list(userId);
		expect(result).toHaveLength(1);
		expect(result[0].items).toHaveLength(2);
	});

	it("returns only scheduled routines in today's view", async () => {
		const mondayRoutine = { ...routineRow(), scheduleType: 'specific_days', daysOfWeek: '1' };
		const dailyRoutine = routineRow();
		repository.listRoutines.mockResolvedValue([mondayRoutine, dailyRoutine]);

		// 2026-08-17 was a Monday
		const result = await service.getToday(userId, new Date('2026-08-17T10:00:00Z'));

		expect(result.date).toBe('2026-08-17');
		expect(result.routines.map((routine) => routine.name)).toContain('Morning routine');
		expect(result.routines.find((routine) => routine.name === 'Morning routine')).toBeDefined();
	});

	it('toggles an item on then off for today', async () => {
		const first = await service.toggleItem(userId, routineRow().id, itemRow({}).id);
		expect(first.completed).toBe(true);
		expect(repository.insertCompletion).toHaveBeenCalledOnce();

		repository.findCompletion.mockResolvedValue({
			id: '44444444-4444-4444-4444-444444444444',
			userId,
			routineId: '22222222-2222-2222-2222-222222222222',
			itemId: '33333333-3333-3333-3333-333333333330',
			completedOn: '2026-08-23',
			completedAt: new Date(),
		});
		const second = await service.toggleItem(userId, routineRow().id, itemRow({}).id);
		expect(second.completed).toBe(false);
		expect(repository.deleteCompletion).toHaveBeenCalledOnce();
	});

	it('archives a routine via soft delete', async () => {
		const result = await service.archive(userId, routineRow().id);
		expect(repository.updateRoutine).toHaveBeenCalledWith(
			userId,
			routineRow().id,
			expect.objectContaining({ archivedAt: expect.any(Date) }),
		);
		expect(result.archived).toBe(true);
	});

	it('throws when the routine does not belong to the user', async () => {
		existingRoutine = null;
		await expect(service.get(userId, '99999999-9999-9999-9999-999999999999')).rejects.toThrow(
			/not found/i,
		);
	});
});
