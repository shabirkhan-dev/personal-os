import type { SqlDriver } from "./driver";

/** One synced record: a module's document (an application, a flashcard…) in a named collection. */
export type SyncRecord = {
	collection: string;
	id: string;
	data: unknown;
	/** Milliseconds since epoch of the last change; the newest change wins. */
	updatedAt: number;
	/** Set when the record was deleted; deletions sync like any other change. */
	deletedAt: number | null;
};

type Row = {
	collection: string;
	id: string;
	data: string;
	updated_at: number;
	deleted_at: number | null;
	dirty: number;
};

type Listener = (collections: ReadonlySet<string>) => void;

/** Schema steps, applied in order and tracked with `PRAGMA user_version`. Never edit a shipped step. */
const MIGRATIONS: readonly string[] = [
	`CREATE TABLE records (
		collection TEXT NOT NULL,
		id TEXT NOT NULL,
		data TEXT NOT NULL,
		updated_at INTEGER NOT NULL,
		deleted_at INTEGER,
		dirty INTEGER NOT NULL DEFAULT 0,
		PRIMARY KEY (collection, id)
	) WITHOUT ROWID;
	CREATE INDEX records_dirty ON records (dirty) WHERE dirty = 1;
	CREATE TABLE meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,
];

/**
 * The on-device source of truth for every module that has moved off JSON files. Writes are
 * local and instant; each one marks the record dirty so the sync engine can push it later.
 */
export class RecordStore {
	private readonly listeners = new Set<Listener>();
	private queue: Promise<unknown> = Promise.resolve();

	private constructor(
		private readonly db: SqlDriver,
		private readonly clock: () => number,
	) {}

	static async open(db: SqlDriver, clock: () => number = Date.now): Promise<RecordStore> {
		await migrate(db);
		return new RecordStore(db, clock);
	}

	/** Live (not deleted) documents in a collection, newest change first. */
	async list(collection: string): Promise<unknown[]> {
		const rows = await this.db.all<Pick<Row, "data">>(
			"SELECT data FROM records WHERE collection = ? AND deleted_at IS NULL ORDER BY updated_at DESC",
			[collection],
		);
		return rows.map((row) => JSON.parse(row.data) as unknown);
	}

	async get(collection: string, id: string): Promise<unknown | null> {
		const row = await this.row(collection, id);
		return row && row.deleted_at === null ? (JSON.parse(row.data) as unknown) : null;
	}

	/** Creates or replaces a document. */
	put(collection: string, id: string, data: unknown): Promise<void> {
		return this.write([collection], async () => {
			const updatedAt = this.nextVersion(await this.row(collection, id));
			await this.db.run(
				`INSERT INTO records (collection, id, data, updated_at, deleted_at, dirty)
				 VALUES (?, ?, ?, ?, NULL, 1)
				 ON CONFLICT (collection, id) DO UPDATE SET
				   data = excluded.data, updated_at = excluded.updated_at, deleted_at = NULL, dirty = 1`,
				[collection, id, JSON.stringify(data), updatedAt],
			);
		});
	}

	/** Deletes a document, leaving a tombstone so other devices delete it too. */
	remove(collection: string, id: string): Promise<void> {
		return this.write([collection], async () => {
			const existing = await this.row(collection, id);
			if (!existing || existing.deleted_at !== null) return;
			const updatedAt = this.nextVersion(existing);
			await this.db.run(
				"UPDATE records SET updated_at = ?, deleted_at = ?, dirty = 1 WHERE collection = ? AND id = ?",
				[updatedAt, updatedAt, collection, id],
			);
		});
	}

	/** Local changes not yet accepted by the server, oldest first. */
	async pending(limit: number): Promise<SyncRecord[]> {
		const rows = await this.db.all<Row>(
			"SELECT * FROM records WHERE dirty = 1 ORDER BY updated_at ASC LIMIT ?",
			[limit],
		);
		return rows.map(toRecord);
	}

	/** Clears the dirty flag, unless the record changed again while it was being pushed. */
	markSynced(
		records: readonly Pick<SyncRecord, "collection" | "id" | "updatedAt">[],
	): Promise<void> {
		return this.write([], async () => {
			await Promise.all(
				records.map((record) =>
					this.db.run(
						"UPDATE records SET dirty = 0 WHERE collection = ? AND id = ? AND updated_at = ?",
						[record.collection, record.id, record.updatedAt],
					),
				),
			);
		});
	}

	/** Applies changes from the server. A newer unsynced local edit wins and is pushed later. */
	applyRemote(records: readonly SyncRecord[]): Promise<void> {
		const collections = records.map((record) => record.collection);
		return this.write(collections, async () => {
			const locals = await Promise.all(
				records.map((record) => this.row(record.collection, record.id)),
			);
			const newer = records.filter((record, index) => {
				const local = locals[index];
				return !local || local.updated_at <= record.updatedAt;
			});
			await Promise.all(
				newer.map((record) =>
					this.db.run(
						`INSERT INTO records (collection, id, data, updated_at, deleted_at, dirty)
						 VALUES (?, ?, ?, ?, ?, 0)
						 ON CONFLICT (collection, id) DO UPDATE SET
						   data = excluded.data, updated_at = excluded.updated_at,
						   deleted_at = excluded.deleted_at, dirty = 0`,
						[
							record.collection,
							record.id,
							JSON.stringify(record.data),
							record.updatedAt,
							record.deletedAt,
						],
					),
				),
			);
		});
	}

	async getMeta(key: string): Promise<string | null> {
		const rows = await this.db.all<{ value: string }>("SELECT value FROM meta WHERE key = ?", [
			key,
		]);
		return rows[0]?.value ?? null;
	}

	setMeta(key: string, value: string | null): Promise<void> {
		return this.write([], async () => {
			if (value === null) await this.db.run("DELETE FROM meta WHERE key = ?", [key]);
			else {
				await this.db.run(
					"INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
					[key, value],
				);
			}
		});
	}

	/** Removes every record and sync position (another account signed in). */
	async clear(): Promise<void> {
		const rows = await this.db.all<{ collection: string }>(
			"SELECT DISTINCT collection FROM records",
		);
		await this.write(
			rows.map((row) => row.collection),
			async () => {
				await this.db.run("DELETE FROM records");
				await this.db.run("DELETE FROM meta");
			},
		);
	}

	/** Called after every committed write with the collections it touched. */
	subscribe(listener: Listener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private row(collection: string, id: string): Promise<Row | null> {
		return this.db
			.all<Row>("SELECT * FROM records WHERE collection = ? AND id = ?", [collection, id])
			.then((rows) => rows[0] ?? null);
	}

	/** Strictly increasing per record, even if the device clock steps backwards. */
	private nextVersion(existing: Row | null): number {
		const now = this.clock();
		return existing ? Math.max(now, existing.updated_at + 1) : now;
	}

	/** Writes run one at a time, each in a transaction, then listeners hear about them. */
	private write(collections: readonly string[], task: () => Promise<void>): Promise<void> {
		const run = this.queue.then(async () => {
			await this.db.transaction(task);
			if (collections.length > 0) this.emit(new Set(collections));
		});
		this.queue = run.catch(() => undefined);
		return run;
	}

	private emit(collections: ReadonlySet<string>): void {
		for (const listener of this.listeners) {
			try {
				listener(collections);
			} catch (error) {
				console.error("[db] change listener failed", error);
			}
		}
	}
}

async function migrate(db: SqlDriver): Promise<void> {
	const [row] = await db.all<{ user_version: number }>("PRAGMA user_version");
	const current = row?.user_version ?? 0;
	for (let version = current; version < MIGRATIONS.length; version += 1) {
		const step = MIGRATIONS[version];
		if (!step) continue;
		// Schema steps must apply in order, one at a time.
		// oxlint-disable-next-line eslint/no-await-in-loop
		await db.transaction(async () => {
			await db.exec(step);
			await db.exec(`PRAGMA user_version = ${version + 1}`);
		});
	}
}

function toRecord(row: Row): SyncRecord {
	return {
		collection: row.collection,
		id: row.id,
		data: JSON.parse(row.data) as unknown,
		updatedAt: row.updated_at,
		deletedAt: row.deleted_at,
	};
}
