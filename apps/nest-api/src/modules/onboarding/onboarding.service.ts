import { Injectable, Logger } from '@nestjs/common';

import type { OnboardingProfileRecord } from '@/database/schema';
import {
	type OnboardingAnswers,
	onboardingAnswersSchema,
	type OnboardingView,
} from './onboarding.dto';
import { OnboardingRepository } from './onboarding.repository';

/** Bump when the answers shape changes; old rows are still returned with their version. */
export const ONBOARDING_SCHEMA_VERSION = 1;

@Injectable()
export class OnboardingService {
	private readonly logger = new Logger(OnboardingService.name);

	constructor(private readonly repository: OnboardingRepository) {}

	/**
	 * The saved answers, or `null` before the first save. A stored row that no longer matches the
	 * schema (an older version or a manual edit) is also `null`, so the app uploads fresh answers.
	 */
	async get(userId: string): Promise<OnboardingView | null> {
		const record = await this.repository.findByUserId(userId);
		if (!record) return null;
		const parsed = onboardingAnswersSchema.safeParse(record.answers);
		if (!parsed.success) {
			this.logger.warn(
				`Stored onboarding answers for ${userId} (v${record.schemaVersion}) do not match the schema`,
			);
			return null;
		}
		return toView(record, parsed.data);
	}

	async save(userId: string, answers: OnboardingAnswers): Promise<OnboardingView> {
		const record = await this.repository.upsert(userId, answers, ONBOARDING_SCHEMA_VERSION);
		return toView(record, answers);
	}
}

function toView(record: OnboardingProfileRecord, answers: OnboardingAnswers): OnboardingView {
	return {
		answers,
		schemaVersion: record.schemaVersion,
		updatedAt: record.updatedAt.toISOString(),
	};
}
