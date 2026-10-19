import { and, isNotNull, lt, or } from "drizzle-orm";

import type { Database } from "@/db/client";
import { aiUsage, sessions, signInCodes } from "@/db/schema";

const DAY = 86_400_000;

export type CleanupResult = { codes: number; sessions: number; aiUsage: number };

/**
 * Daily housekeeping (the Worker's cron): drops rows nothing reads any more, so tables don't grow
 * forever. Sync tombstones stay: a phone that hasn't synced in a while still needs to learn about
 * deletes.
 */
export async function cleanup(db: Database, now = Date.now()): Promise<CleanupResult> {
	const codes = await db
		.delete(signInCodes)
		.where(lt(signInCodes.createdAt, new Date(now - DAY)))
		.returning({ id: signInCodes.id });
	const ended = await db
		.delete(sessions)
		.where(
			or(
				lt(sessions.expiresAt, new Date(now - 7 * DAY)),
				and(isNotNull(sessions.revokedAt), lt(sessions.revokedAt, new Date(now - 7 * DAY))),
			),
		)
		.returning({ id: sessions.id });
	const usage = await db
		.delete(aiUsage)
		.where(lt(aiUsage.day, new Date(now - 30 * DAY).toISOString().slice(0, 10)))
		.returning({ day: aiUsage.day });
	return { codes: codes.length, sessions: ended.length, aiUsage: usage.length };
}
