import { index, integer, pgEnum, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

export const authChallengePurpose = pgEnum('auth_challenge_purpose', [
	'email_verification',
	'password_reset',
	'magic_link',
	'mfa_login',
	'webauthn_registration',
	'webauthn_authentication',
]);

export const authChallenges = pgTable(
	'auth_challenges',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		email: varchar('email', { length: 320 }).notNull(),
		purpose: authChallengePurpose('purpose').notNull(),
		codeHash: varchar('code_hash', { length: 64 }).notNull(),
		attempts: integer('attempts').notNull().default(0),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		consumedAt: timestamp('consumed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index('auth_challenges_user_purpose_idx').on(table.userId, table.purpose),
		index('auth_challenges_expires_at_idx').on(table.expiresAt),
	],
);

export type AuthChallengeRecord = typeof authChallenges.$inferSelect;
export type AuthChallengePurpose = AuthChallengeRecord['purpose'];
