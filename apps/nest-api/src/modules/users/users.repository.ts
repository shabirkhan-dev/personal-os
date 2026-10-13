import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService } from '@/database/database.service';
import { type UserRecord, userProfiles, users } from '@/database/schema';

@Injectable()
export class UsersRepository {
	constructor(private readonly database: DatabaseService) {}

	async create(input: {
		email: string;
		username: string;
		passwordHash: string | null;
		emailVerifiedAt?: Date;
		displayName?: string | null;
		avatarUrl?: string | null;
	}): Promise<UserRecord> {
		return this.database.db.transaction(async (transaction) => {
			const [user] = await transaction
				.insert(users)
				.values({
					email: input.email,
					username: input.username,
					passwordHash: input.passwordHash,
					emailVerifiedAt: input.emailVerifiedAt,
				})
				.returning();
			if (!user) throw new Error('User insert did not return a record');
			await transaction.insert(userProfiles).values({
				userId: user.id,
				displayName: input.displayName,
				avatarUrl: input.avatarUrl,
			});
			return user;
		});
	}

	async findById(userId: string): Promise<UserRecord | null> {
		const [user] = await this.database.db.select().from(users).where(eq(users.id, userId)).limit(1);
		return user ?? null;
	}

	async findByEmail(email: string): Promise<UserRecord | null> {
		const [user] = await this.database.db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);
		return user ?? null;
	}

	async findByUsername(username: string): Promise<UserRecord | null> {
		const [user] = await this.database.db
			.select()
			.from(users)
			.where(eq(users.username, username))
			.limit(1);
		return user ?? null;
	}

	async updateLoginSecurity(
		userId: string,
		input: { failedLoginAttempts: number; lockedUntil: Date | null },
	): Promise<void> {
		await this.database.db
			.update(users)
			.set({ ...input, updatedAt: new Date() })
			.where(eq(users.id, userId));
	}

	async markEmailVerified(userId: string): Promise<UserRecord | null> {
		const [user] = await this.database.db
			.update(users)
			.set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
			.where(eq(users.id, userId))
			.returning();
		return user ?? null;
	}

	async updatePassword(userId: string, passwordHash: string): Promise<void> {
		const now = new Date();
		await this.database.db
			.update(users)
			.set({ passwordHash, passwordChangedAt: now, updatedAt: now })
			.where(eq(users.id, userId));
	}

	async updateUsername(userId: string, username: string): Promise<UserRecord | null> {
		const [user] = await this.database.db
			.update(users)
			.set({ username, updatedAt: new Date() })
			.where(eq(users.id, userId))
			.returning();
		return user ?? null;
	}
}
