import { type QueryClient, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getRecordStore } from "./database";
import type { RecordStore } from "./record-store";

/** A module's typed slice of the record store, e.g. Career's applications. */
export type Collection<T extends { id: string }> = {
	name: string;
	/** Turns a stored value (possibly from an older app version) into `T`, or null to skip it. */
	parse: (raw: unknown) => T | null;
};

export function defineCollection<T extends { id: string }>(
	name: string,
	parse: (raw: unknown) => T | null,
): Collection<T> {
	if (!/^[a-z][a-z0-9-]{0,63}$/.test(name)) throw new Error(`Invalid collection name: ${name}`);
	return { name, parse };
}

export const recordsKey = (collection: string) => ["records", collection] as const;

export async function listItems<T extends { id: string }>(
	collection: Collection<T>,
	store?: RecordStore,
): Promise<T[]> {
	const source = store ?? (await getRecordStore());
	const out: T[] = [];
	for (const raw of await source.list(collection.name)) {
		const item = collection.parse(raw);
		if (item) out.push(item);
	}
	return out;
}

export async function saveItem<T extends { id: string }>(
	collection: Collection<T>,
	item: T,
	store?: RecordStore,
): Promise<void> {
	await (store ?? (await getRecordStore())).put(collection.name, item.id, item);
}

export async function removeItem<T extends { id: string }>(
	collection: Collection<T>,
	id: string,
	store?: RecordStore,
): Promise<void> {
	await (store ?? (await getRecordStore())).remove(collection.name, id);
}

/**
 * Every live item in a collection. Reads come from the phone, so they work offline
 * (`networkMode: "always"`) and never go stale on their own; writes refresh them.
 */
export function useCollection<T extends { id: string }>(
	collection: Collection<T>,
): UseQueryResult<T[]> {
	return useQuery({
		queryKey: recordsKey(collection.name),
		queryFn: () => listItems(collection),
		networkMode: "always",
		staleTime: Number.POSITIVE_INFINITY,
	});
}

/** Refreshes the cached queries of every collection a write touched. */
export function bridgeStoreToQueries(store: RecordStore, queryClient: QueryClient): () => void {
	return store.subscribe((collections) => {
		for (const name of collections) {
			queryClient
				.invalidateQueries({ queryKey: recordsKey(name) })
				.catch((error: unknown) => console.error("[db] could not refresh", name, error));
		}
	});
}
