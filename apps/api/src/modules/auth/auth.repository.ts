import { and, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";

import type { Database } from "@/db/client";
import { type SessionRow, type SignInCodeRow, sessions, signInCodes, users } from "@/db/schema";

export async function saveCode(
	db: Database,
	input: { email: string; displayName: string | null; codeHash: string; expiresAt: Date },
): Promise<void> {
	await db.insert(signInCodes).values(input);
}

/** The newest unused code for this email; older ones stop working once a new one is sent. */
export async function latestCode(db: Database, email: string): Promise<SignInCodeRow | null> {
	const [row] = await db
		.select()
		.from(signInCodes)
		.where(and(eq(signInCodes.email, email), isNull(signInCodes.consumedAt)))
		.orderBy(desc(signInCodes.createdAt))
		.limit(1);
	return row ?? null;
}

/**
 * Spends one try before the code is compared, so parallel guesses can't all read the same count.
 * False once the code has used up its tries or was already used.
 */
export async function claimAttempt(
	db: Database,
	id: string,
	maxAttempts: number,
): Promise<boolean> {
	const rows = await db
		.update(signInCodes)
		.set({ attempts: sql`${signInCodes.attempts} + 1` })
		.where(
			and(
				eq(signInCodes.id, id),
				isNull(signInCodes.consumedAt),
				lt(signInCodes.attempts, maxAttempts),
			),
		)
		.returning({ id: signInCodes.id });
	return rows.length === 1;
}

/** Single use: of two requests racing with the same code, only one gets `true`. */
export async function consumeCode(db: Database, id: string): Promise<boolean> {
	const rows = await db
		.update(signInCodes)
		.set({ consumedAt: new Date() })
		.where(and(eq(signInCodes.id, id), isNull(signInCodes.consumedAt)))
		.returning({ id: signInCodes.id });
	return rows.length === 1;
}

export async function createSession(
	db: Database,
	input: {
		id: string;
		userId: string;
		refreshTokenHash: string;
		userAgent: string | null;
		expiresAt: Date;
	},
): Promise<void> {
	await db.insert(sessions).values(input);
}

export async function findSession(db: Database, id: string): Promise<SessionRow | null> {
	const [row] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
	return row ?? null;
}

/** Swaps the refresh token only if it is still the one the caller presented. */
export async function rotateSession(
	db: Database,
	id: string,
	previousHash: string,
	nextHash: string,
	expiresAt: Date,
): Promise<boolean> {
	const rows = await db
		.update(sessions)
		.set({ refreshTokenHash: nextHash, expiresAt, lastUsedAt: new Date() })
		.where(
			and(
				eq(sessions.id, id),
				eq(sessions.refreshTokenHash, previousHash),
				isNull(sessions.revokedAt),
			),
		)
		.returning({ id: sessions.id });
	return rows.length === 1;
}

export async function revokeSession(db: Database, id: string, reason: string): Promise<void> {
	await db
		.update(sessions)
		.set({ revokedAt: new Date(), revocationReason: reason })
		.where(and(eq(sessions.id, id), isNull(sessions.revokedAt)));
}

/** True when the session is live and its user still active: one query per authed request. */
export async function isSessionLive(
	db: Database,
	sessionId: string,
	userId: string,
	now = new Date(),
): Promise<boolean> {
	const rows = await db
		.select({ id: sessions.id })
		.from(sessions)
		.innerJoin(users, eq(users.id, sessions.userId))
		.where(
			and(
				eq(sessions.id, sessionId),
				eq(sessions.userId, userId),
				isNull(sessions.revokedAt),
				gt(sessions.expiresAt, now),
				eq(users.isActive, true),
			),
		)
		.limit(1);
	return rows.length === 1;
}
