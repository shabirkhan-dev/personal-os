import 'dotenv/config';

import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppConfigService } from '@/config/app-config.service';
import { DatabaseService } from '@/database/database.service';
import { users } from '@/database/schema';
import type { SyncRecordInput } from '@/modules/sync/sync.dto';
import { SyncRepository } from '@/modules/sync/sync.repository';
import { SyncService } from '@/modules/sync/sync.service';

const record = (id: string, updatedAt: number, data: unknown = { id }): SyncRecordInput => ({
	collection: 'career-applications',
	id,
	data,
	updatedAt,
	deletedAt: null,
});

describe('database-backed sync', () => {
	const config = new AppConfigService();
	const database = new DatabaseService(config);
	const sync = new SyncService(new SyncRepository(database));
	let userId = '';
	let otherUserId = '';

	async function createUser(label: string): Promise<string> {
		const [user] = await database.db
			.insert(users)
			.values({
				email: `sync-${label}-${randomUUID()}@example.com`,
				username: `sync-${randomUUID()}`,
			})
			.returning({ id: users.id });
		if (!user) throw new Error('user insert failed');
		return user.id;
	}

	beforeAll(async () => {
		userId = await createUser('a');
		otherUserId = await createUser('b');
	});

	afterAll(async () => {
		await database.db.delete(users).where(eq(users.id, userId));
		await database.db.delete(users).where(eq(users.id, otherUserId));
		await database.onModuleDestroy();
	});

	it('stores pushed records and returns them after the cursor', async () => {
		const first = await sync.sync(userId, { cursor: null, changes: [record('a1', 1_000)] });
		expect(first.conflicts).toHaveLength(0);
		expect(first.changes.map((change) => change.id)).toEqual(['a1']);

		const second = await sync.sync(userId, { cursor: first.cursor, changes: [] });
		expect(second.changes).toHaveLength(0);
		expect(second.cursor).toBe(first.cursor);
	});

	it('keeps the newest version and returns the server copy as a conflict', async () => {
		const start = await sync.sync(userId, { cursor: null, changes: [] });
		await sync.sync(userId, { cursor: start.cursor, changes: [record('c1', 5_000, { v: 'new' })] });

		const stale = await sync.sync(userId, {
			cursor: start.cursor,
			changes: [record('c1', 4_000, { v: 'old' })],
		});
		expect(stale.conflicts).toEqual([
			expect.objectContaining({ id: 'c1', updatedAt: 5_000, data: { v: 'new' } }),
		]);

		const newer = await sync.sync(userId, {
			cursor: start.cursor,
			changes: [record('c1', 6_000, { v: 'newer' })],
		});
		expect(newer.conflicts).toHaveLength(0);
		expect(newer.changes.find((change) => change.id === 'c1')?.data).toEqual({ v: 'newer' });
	});

	it('syncs deletions as tombstones', async () => {
		await sync.sync(userId, { cursor: null, changes: [record('d1', 1_000)] });
		const deleted = await sync.sync(userId, {
			cursor: null,
			changes: [{ ...record('d1', 2_000), deletedAt: 2_000 }],
		});
		expect(deleted.changes.find((change) => change.id === 'd1')?.deletedAt).toBe(2_000);
	});

	it('pages pulls and never leaks another user’s records', async () => {
		await sync.sync(otherUserId, { cursor: null, changes: [record('private', 1_000)] });
		const all = await sync.sync(userId, { cursor: null, changes: [] });
		expect(all.changes.some((change) => change.id === 'private')).toBe(false);
	});

	it('rejects clocks far in the future and duplicate records', async () => {
		await expect(
			sync.sync(userId, { cursor: null, changes: [record('f1', Date.now() + 3 * 86_400_000)] }),
		).rejects.toMatchObject({ response: { code: 'SYNC_CLOCK_AHEAD' } });
		await expect(
			sync.sync(userId, { cursor: null, changes: [record('x', 1), record('x', 2)] }),
		).rejects.toMatchObject({ response: { code: 'SYNC_DUPLICATE_RECORD' } });
	});
});
