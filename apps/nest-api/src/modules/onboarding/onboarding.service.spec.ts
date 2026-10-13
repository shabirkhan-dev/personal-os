import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';

import type { OnboardingProfileRecord } from '@/database/schema';
import { type OnboardingAnswers, saveOnboardingSchema } from './onboarding.dto';
import { OnboardingRepository } from './onboarding.repository';
import { ONBOARDING_SCHEMA_VERSION, OnboardingService } from './onboarding.service';

const userId = 'a01a0cab-a947-44f0-bfcd-4b8e8c907534';

const answers: OnboardingAnswers = {
	path: 'steps',
	name: 'Shabir Khan',
	gender: 'male',
	birthday: { day: 12, month: 3, year: 1998 },
	heightCm: 175,
	weightKg: 72,
	heightUnit: 'cm',
	weightUnit: 'kg',
	wakeMinutes: 390,
	bedMinutes: 1380,
	workStartMinutes: 540,
	workEndMinutes: 1080,
	workdays: [true, true, true, true, true, false, false],
	workStyle: 'hybrid',
	goals: ['save-money', 'lose-weight'],
	modules: ['daily-life', 'finance', 'workout'],
	connections: { calendar: true, smartwatch: false, 'bank-sms': false, microphone: false },
	appleHealth: true,
	heyOs: true,
	reminders: {
		'morning-plan': true,
		'evening-check-in': true,
		'workout-nudge': true,
		'bill-reminders': true,
	},
	completed: true,
};

function record(stored: unknown): OnboardingProfileRecord {
	return {
		userId,
		answers: stored,
		schemaVersion: ONBOARDING_SCHEMA_VERSION,
		createdAt: new Date('2026-10-13T00:00:00.000Z'),
		updatedAt: new Date('2026-10-13T01:00:00.000Z'),
	};
}

describe('OnboardingService', () => {
	let repository: Mocked<OnboardingRepository>;
	let service: OnboardingService;

	beforeEach(() => {
		repository = {
			findByUserId: vi.fn(),
			upsert: vi.fn(),
		} as unknown as Mocked<OnboardingRepository>;
		service = new OnboardingService(repository);
	});

	it('returns null before the first save', async () => {
		repository.findByUserId.mockResolvedValue(null);
		await expect(service.get(userId)).resolves.toBeNull();
	});

	it('saves the answers with the current schema version', async () => {
		repository.upsert.mockResolvedValue(record(answers));
		const view = await service.save(userId, answers);
		expect(repository.upsert).toHaveBeenCalledWith(userId, answers, ONBOARDING_SCHEMA_VERSION);
		expect(view).toEqual({
			answers,
			schemaVersion: ONBOARDING_SCHEMA_VERSION,
			updatedAt: '2026-10-13T01:00:00.000Z',
		});
	});

	it('treats a stored row that no longer matches the schema as missing', async () => {
		repository.findByUserId.mockResolvedValue(record({ ...answers, path: 'unknown' }));
		await expect(service.get(userId)).resolves.toBeNull();
	});

	it('rejects unknown keys and out-of-range values on save', () => {
		expect(saveOnboardingSchema.safeParse({ answers }).success).toBe(true);
		expect(saveOnboardingSchema.safeParse({ answers: { ...answers, extra: 1 } }).success).toBe(
			false,
		);
		expect(
			saveOnboardingSchema.safeParse({ answers: { ...answers, wakeMinutes: 1440 } }).success,
		).toBe(false);
		expect(
			saveOnboardingSchema.safeParse({ answers: { ...answers, workdays: [true] } }).success,
		).toBe(false);
	});
});
