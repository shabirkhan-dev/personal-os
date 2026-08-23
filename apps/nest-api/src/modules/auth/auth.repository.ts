import { Injectable } from '@nestjs/common';
import { and, desc, eq, gt, isNull, ne, sql } from 'drizzle-orm';

import { DatabaseService } from '@/database/database.service';
import {
	type AuthChallengePurpose,
	type AuthChallengeRecord,
	authChallenges,
	type SessionRecord,
	sessions,
	users,
} from '@/database/schema';
import type { RequestMetadata } from './auth.types';

@Injectable()
export class AuthRepository {
	constructor(private readonly database: DatabaseService) {}

	async createChallenge(input: {
		id?: string;
		userId: string;
		email: string;
		purpose: AuthChallengePurpose;
		codeHash: string;
		expiresAt: Date;
		action?: string | null;
		sessionId?: string | null;
	}): Promise<AuthChallengeRecord> {
		return this.database.db.transaction(async (transaction) => {
			const now = new Date();
			await transaction
				.update(authChallenges)
				.set({ consumedAt: now })
				.where(
					and(
						eq(authChallenges.userId, input.userId),
						eq(authChallenges.purpose, input.purpose),
						isNull(authChallenges.consumedAt),
					),
				);

			const [challenge] = await transaction
				.insert(authChallenges)
				.values({
					id: input.id,
					userId: input.userId,
					email: input.email,
					purpose: input.purpose,
					codeHash: input.codeHash,
					expiresAt: input.expiresAt,
					action: input.action ?? null,
					sessionId: input.sessionId ?? null,
				})
				.returning();
			if (!challenge) {
				throw new Error('Auth challenge insert did not return a record');
			}
			return challenge;
		});
	}

	async findChallengeById(challengeId: string): Promise<AuthChallengeRecord | null> {
		const [challenge] = await this.database.db
			.select()
			.from(authChallenges)
			.where(eq(authChallenges.id, challengeId))
			.limit(1);
		return challenge ?? null;
	}

	async consumeChallenge(challengeId: string): Promise<boolean> {
		const [challenge] = await this.database.db
			.update(authChallenges)
			.set({ consumedAt: new Date() })
			.where(and(eq(authChallenges.id, challengeId), isNull(authChallenges.consumedAt)))
			.returning({ id: authChallenges.id });
		return Boolean(challenge);
	}

	async findLatestChallenge(
		email: string,
		purpose: AuthChallengePurpose,
	): Promise<AuthChallengeRecord | null> {
		const [challenge] = await this.database.db
			.select()
			.from(authChallenges)
			.where(
				and(
					eq(authChallenges.email, email),
					eq(authChallenges.purpose, purpose),
					isNull(authChallenges.consumedAt),
				),
			)
			.orderBy(desc(authChallenges.createdAt))
			.limit(1);
		return challenge ?? null;
	}

	async recordChallengeAttempt(challengeId: string, maxAttempts: number): Promise<void> {
		await this.database.db.transaction(async (transaction) => {
			const [row] = await transaction
				.update(authChallenges)
				.set({ attempts: sql`${authChallenges.attempts} + 1` })
				.where(and(eq(authChallenges.id, challengeId), isNull(authChallenges.consumedAt)))
				.returning({ attempts: authChallenges.attempts });

			if (row && row.attempts >= maxAttempts) {
				await transaction
					.update(authChallenges)
					.set({ consumedAt: new Date() })
					.where(and(eq(authChallenges.id, challengeId), isNull(authChallenges.consumedAt)));
			}
		});
	}

	/**
	 * Consumes the challenge and marks the user verified atomically. Returns
	 * false when a concurrent request already consumed the challenge.
	 */
	async completeEmailVerification(challengeId: string, userId: string): Promise<boolean> {
		return this.database.db.transaction(async (transaction) => {
			const now = new Date();
			const consumed = await transaction
				.update(authChallenges)
				.set({ consumedAt: now })
				.where(and(eq(authChallenges.id, challengeId), isNull(authChallenges.consumedAt)))
				.returning({ id: authChallenges.id });
			if (consumed.length === 0) {
				return false;
			}
			await transaction
				.update(users)
				.set({ emailVerifiedAt: now, updatedAt: now })
				.where(eq(users.id, userId));
			return true;
		});
	}

	/**
	 * Consumes the challenge and applies the password reset atomically. Returns
	 * false when a concurrent request already consumed the challenge.
	 */
	async completePasswordReset(input: {
		challengeId: string;
		userId: string;
		passwordHash: string;
	}): Promise<boolean> {
		return this.database.db.transaction(async (transaction) => {
			const now = new Date();
			const consumed = await transaction
				.update(authChallenges)
				.set({ consumedAt: now })
				.where(and(eq(authChallenges.id, input.challengeId), isNull(authChallenges.consumedAt)))
				.returning({ id: authChallenges.id });
			if (consumed.length === 0) {
				return false;
			}
			await transaction
				.update(users)
				.set({
					passwordHash: input.passwordHash,
					passwordChangedAt: now,
					updatedAt: now,
					failedLoginAttempts: 0,
					lockedUntil: null,
				})
				.where(eq(users.id, input.userId));
			await transaction
				.update(sessions)
				.set({ revokedAt: now, revocationReason: 'password_reset' })
				.where(and(eq(sessions.userId, input.userId), isNull(sessions.revokedAt)));
			return true;
		});
	}

	async changePassword(input: {
		userId: string;
		currentSessionId: string;
		passwordHash: string;
	}): Promise<void> {
		await this.database.db.transaction(async (transaction) => {
			const now = new Date();
			await transaction
				.update(users)
				.set({
					passwordHash: input.passwordHash,
					passwordChangedAt: now,
					updatedAt: now,
				})
				.where(eq(users.id, input.userId));
			await transaction
				.update(sessions)
				.set({ revokedAt: now, revocationReason: 'password_changed' })
				.where(
					and(
						eq(sessions.userId, input.userId),
						ne(sessions.id, input.currentSessionId),
						isNull(sessions.revokedAt),
					),
				);
		});
	}

	async createSession(input: {
		id: string;
		userId: string;
		refreshTokenHash: string;
		expiresAt: Date;
		metadata: RequestMetadata;
	}): Promise<SessionRecord> {
		const [session] = await this.database.db
			.insert(sessions)
			.values({
				id: input.id,
				userId: input.userId,
				refreshTokenHash: input.refreshTokenHash,
				expiresAt: input.expiresAt,
				userAgent: input.metadata.userAgent,
				ipAddress: input.metadata.ipAddress,
			})
			.returning();
		if (!session) {
			throw new Error('Session insert did not return a record');
		}
		return session;
	}

	async findSessionById(sessionId: string): Promise<SessionRecord | null> {
		const [session] = await this.database.db
			.select()
			.from(sessions)
			.where(eq(sessions.id, sessionId))
			.limit(1);
		return session ?? null;
	}

	async rotateSession(
		sessionId: string,
		currentRefreshTokenHash: string,
		refreshTokenHash: string,
		expiresAt: Date,
	): Promise<SessionRecord | null> {
		const [session] = await this.database.db
			.update(sessions)
			.set({ refreshTokenHash, expiresAt, lastUsedAt: new Date() })
			.where(
				and(
					eq(sessions.id, sessionId),
					eq(sessions.refreshTokenHash, currentRefreshTokenHash),
					isNull(sessions.revokedAt),
				),
			)
			.returning();
		return session ?? null;
	}

	async listActiveSessions(userId: string): Promise<SessionRecord[]> {
		return this.database.db
			.select()
			.from(sessions)
			.where(
				and(
					eq(sessions.userId, userId),
					isNull(sessions.revokedAt),
					gt(sessions.expiresAt, new Date()),
				),
			)
			.orderBy(desc(sessions.lastUsedAt));
	}

	async revokeSession(sessionId: string, userId: string, reason: string): Promise<boolean> {
		const revoked = await this.database.db
			.update(sessions)
			.set({ revokedAt: new Date(), revocationReason: reason })
			.where(
				and(eq(sessions.id, sessionId), eq(sessions.userId, userId), isNull(sessions.revokedAt)),
			)
			.returning({ id: sessions.id });
		return revoked.length > 0;
	}

	async revokeAllSessions(userId: string, reason: string): Promise<void> {
		await this.database.db
			.update(sessions)
			.set({ revokedAt: new Date(), revocationReason: reason })
			.where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
	}
}
