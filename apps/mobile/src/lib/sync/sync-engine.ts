import type { RecordStore, SyncRecord } from "@/lib/db/record-store";

/** One round trip of `POST /sync`: push local changes, pull what changed after `cursor`. */
export type SyncRequest = { cursor: string | null; changes: SyncRecord[] };

export type SyncResponse = {
	/** Pass back on the next request to receive only newer changes. */
	cursor: string;
	/** Changes made elsewhere (other devices, or the server copy of what was just pushed). */
	changes: SyncRecord[];
	/** Pushed records the server already had a newer version of; the server copy wins. */
	conflicts: SyncRecord[];
	/** Pushed records the server skipped as invalid; they are not sent again. */
	rejected?: { collection: string | null; id: string | null; reason: string }[];
	/** More changes are waiting after `cursor`. */
	hasMore: boolean;
};

export type SyncTransport = (request: SyncRequest) => Promise<SyncResponse>;

export type SyncStatus = "idle" | "syncing" | "error";

export type SyncState = {
	status: SyncStatus;
	lastSyncedAt: number | null;
	error: string | null;
};

export const PUSH_BATCH = 200;
/** Keeps each request well under the API's 1 MB body limit. */
export const PUSH_BYTES = 512 * 1024;
/** Stops a runaway loop; anything left goes on the next sync. */
const MAX_ROUNDS = 25;
const CURSOR_KEY = "sync.cursor";
const OWNER_KEY = "sync.owner";

export type SyncEngine = {
	/** Pushes and pulls until both sides are caught up. Concurrent calls share one run. */
	sync(): Promise<void>;
	getState(): SyncState;
	subscribe(listener: (state: SyncState) => void): () => void;
};

export function createSyncEngine(options: {
	store: RecordStore;
	transport: SyncTransport;
	clock?: () => number;
}): SyncEngine {
	const { store, transport, clock = Date.now } = options;
	const listeners = new Set<(state: SyncState) => void>();
	let state: SyncState = { status: "idle", lastSyncedAt: null, error: null };
	let running: Promise<void> | null = null;
	let again = false;

	const setState = (next: Partial<SyncState>) => {
		state = { ...state, ...next };
		for (const listener of listeners) listener(state);
	};

	/** One push-and-pull round; repeats until nothing is pending or waiting on the server. */
	const runRound = async (round: number): Promise<void> => {
		if (round >= MAX_ROUNDS) return;
		const pending = await store.pending(PUSH_BATCH);
		const changes = withinBudget(pending, PUSH_BYTES);
		const cursor = await store.getMeta(CURSOR_KEY);
		const response = await transport({ cursor, changes });
		await store.markSynced(changes);
		if (response.rejected?.length) console.warn("[sync] the server skipped", response.rejected);
		await store.applyRemote([...response.conflicts, ...response.changes]);
		await store.setMeta(CURSOR_KEY, response.cursor);
		const caughtUp =
			!response.hasMore && changes.length === pending.length && pending.length < PUSH_BATCH;
		if (!caughtUp) await runRound(round + 1);
	};

	const run = async () => {
		setState({ status: "syncing", error: null });
		try {
			do {
				again = false;
				// A sync requested mid-run waits for this one: runs must not overlap.
				// oxlint-disable-next-line eslint/no-await-in-loop
				await runRound(0);
			} while (again);
			setState({ status: "idle", lastSyncedAt: clock() });
		} catch (error) {
			setState({ status: "error", error: error instanceof Error ? error.message : String(error) });
			throw error;
		} finally {
			running = null;
		}
	};

	return {
		sync() {
			if (running) {
				again = true;
				return running;
			}
			running = run();
			return running;
		},
		getState: () => state,
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}

/** The longest prefix that fits in `budget` bytes of JSON; always at least one record. */
export function withinBudget(records: readonly SyncRecord[], budget: number): SyncRecord[] {
	const out: SyncRecord[] = [];
	let used = 0;
	for (const record of records) {
		const size = JSON.stringify(record).length;
		if (out.length > 0 && used + size > budget) break;
		out.push(record);
		used += size;
	}
	return out;
}

/**
 * Local records belong to one account. The first account to sign in claims them (data made
 * before sign-in is kept); a different account starts from an empty store.
 */
export async function claimStore(store: RecordStore, userId: string): Promise<void> {
	const owner = await store.getMeta(OWNER_KEY);
	if (owner === userId) return;
	if (owner !== null) await store.clear();
	await store.setMeta(OWNER_KEY, userId);
}
