import { integer, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

/** The answers from the mobile onboarding flow; the plan is derived from them on the device. */
export const onboardingProfiles = pgTable('onboarding_profiles', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' }),
	answers: jsonb('answers').notNull(),
	schemaVersion: integer('schema_version').notNull().default(1),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type OnboardingProfileRecord = typeof onboardingProfiles.$inferSelect;
