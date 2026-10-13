import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService } from '@/database/database.service';
import { onboardingProfiles, type OnboardingProfileRecord } from '@/database/schema';
import type { OnboardingAnswers } from './onboarding.dto';

@Injectable()
export class OnboardingRepository {
	constructor(private readonly database: DatabaseService) {}

	async findByUserId(userId: string): Promise<OnboardingProfileRecord | null> {
		const [record] = await this.database.db
			.select()
			.from(onboardingProfiles)
			.where(eq(onboardingProfiles.userId, userId))
			.limit(1);
		return record ?? null;
	}

	async upsert(
		userId: string,
		answers: OnboardingAnswers,
		schemaVersion: number,
	): Promise<OnboardingProfileRecord> {
		const [record] = await this.database.db
			.insert(onboardingProfiles)
			.values({ userId, answers, schemaVersion })
			.onConflictDoUpdate({
				target: onboardingProfiles.userId,
				set: { answers, schemaVersion, updatedAt: new Date() },
			})
			.returning();
		if (!record) throw new Error('Onboarding upsert did not return a record');
		return record;
	}
}
