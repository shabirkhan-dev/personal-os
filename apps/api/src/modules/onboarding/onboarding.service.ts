import { eq } from "drizzle-orm";

import type { Database } from "@/db/client";
import { type OnboardingRow, onboardingProfiles } from "@/db/schema";
import {
	type OnboardingAnswers,
	onboardingAnswersSchema,
	type OnboardingView,
} from "./onboarding.schema";

/** Bump when the answers shape changes; older rows come back as null so the app re-uploads. */
export const ONBOARDING_SCHEMA_VERSION = 1;

export async function getOnboarding(db: Database, userId: string): Promise<OnboardingView | null> {
	const [row] = await db
		.select()
		.from(onboardingProfiles)
		.where(eq(onboardingProfiles.userId, userId))
		.limit(1);
	if (!row) return null;
	const parsed = onboardingAnswersSchema.safeParse(row.answers);
	if (!parsed.success) {
		console.warn(`[onboarding] stored answers for ${userId} (v${row.schemaVersion}) are stale`);
		return null;
	}
	return toView(row, parsed.data);
}

export async function saveOnboarding(
	db: Database,
	userId: string,
	answers: OnboardingAnswers,
): Promise<OnboardingView> {
	const schemaVersion = ONBOARDING_SCHEMA_VERSION;
	const [row] = await db
		.insert(onboardingProfiles)
		.values({ userId, answers, schemaVersion })
		.onConflictDoUpdate({
			target: onboardingProfiles.userId,
			set: { answers, schemaVersion, updatedAt: new Date() },
		})
		.returning();
	if (!row) throw new Error("Onboarding upsert returned no row");
	return toView(row, answers);
}

function toView(row: OnboardingRow, answers: OnboardingAnswers): OnboardingView {
	return { answers, schemaVersion: row.schemaVersion, updatedAt: row.updatedAt.toISOString() };
}
