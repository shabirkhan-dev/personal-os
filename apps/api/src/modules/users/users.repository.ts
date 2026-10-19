import { eq, sql } from "drizzle-orm";

import type { Database } from "@/db/client";
import { signInCodes, type UserRow, users } from "@/db/schema";

export async function findUserById(db: Database, id: string): Promise<UserRow | null> {
	const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return row ?? null;
}

/** The account for this email, created on first sign-in. */
export async function findOrCreateUser(
	db: Database,
	email: string,
	displayName: string | null,
): Promise<UserRow> {
	const [row] = await db
		.insert(users)
		.values({ email, displayName })
		.onConflictDoUpdate({ target: users.email, set: { updatedAt: sql`${users.updatedAt}` } })
		.returning();
	if (!row) throw new Error("User upsert returned no row");
	return row;
}

/**
 * Removes the account. Sessions, synced records, onboarding answers and AI usage go with it
 * (foreign keys cascade); pending sign-in codes are keyed by email, so they are removed here.
 */
export async function deleteUser(db: Database, user: UserRow): Promise<void> {
	await db.transaction(async (tx) => {
		await tx.delete(signInCodes).where(eq(signInCodes.email, user.email));
		await tx.delete(users).where(eq(users.id, user.id));
	});
}

export async function updateUser(
	db: Database,
	id: string,
	changes: { displayName?: string | null; avatarKey?: string | null },
): Promise<UserRow | null> {
	const [row] = await db
		.update(users)
		.set({ ...changes, updatedAt: new Date() })
		.where(eq(users.id, id))
		.returning();
	return row ?? null;
}
