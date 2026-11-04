import type { Collection } from "@/lib/db/collection";
import type { RecordStore } from "@/lib/db/record-store";

/** One photo still only on this phone, and how to point its record at the uploaded copy. */
export type PhotoJob = {
	collection: string;
	id: string;
	uri: string;
	/** Points the record at `url`; false when the record changed or went away meanwhile. */
	apply: (url: string) => Promise<boolean>;
};

/** A collection whose records carry a photo: Fashion's pieces, Food's meals, Wishlist's dreams… */
export type PhotoTarget = { name: string; jobs: (store: RecordStore) => Promise<PhotoJob[]> };

const isLocal = (uri: string | null): uri is string => uri?.startsWith("file://") ?? false;

async function itemsOf<T extends { id: string }>(collection: Collection<T>, store: RecordStore) {
	return (await store.list(collection.name)).flatMap((raw) => {
		const item = collection.parse(raw);
		return item ? [item] : [];
	});
}

/** Describes where a collection keeps its photo, so its local photos can be uploaded. */
export function photoTarget<T extends { id: string }>(
	collection: Collection<T>,
	photoOf: (item: T) => string | null,
	withPhoto: (item: T, url: string) => T,
): PhotoTarget {
	return {
		name: collection.name,
		jobs: async (store) =>
			(await itemsOf(collection, store)).flatMap((item) => {
				const uri = photoOf(item);
				if (!isLocal(uri)) return [];
				return [
					{
						collection: collection.name,
						id: item.id,
						uri,
						apply: async (url: string) => {
							// Read it again: the person may have changed the photo during the upload.
							const current = (await itemsOf(collection, store)).find((row) => row.id === item.id);
							if (!current || photoOf(current) !== uri) return false;
							await store.put(collection.name, current.id, withPhoto(current, url));
							return true;
						},
					},
				];
			}),
	};
}

export type PhotoSyncResult = { uploaded: number; failed: number };

/**
 * Uploads every photo that is only on this phone and points its record at the copy, so the
 * record's next sync takes the photo to the person's other devices. One at a time; a photo that
 * fails is tried again on the next run.
 */
export async function syncPhotos(
	targets: readonly PhotoTarget[],
	upload: (uri: string) => Promise<string>,
	store: RecordStore,
	onUploaded?: (local: string, url: string) => void,
): Promise<PhotoSyncResult> {
	const result: PhotoSyncResult = { uploaded: 0, failed: 0 };
	for (const target of targets) {
		// oxlint-disable-next-line eslint/no-await-in-loop -- one collection, then one photo, at a time
		for (const job of await target.jobs(store)) {
			try {
				// oxlint-disable-next-line eslint/no-await-in-loop
				const url = await upload(job.uri);
				// oxlint-disable-next-line eslint/no-await-in-loop
				if (await job.apply(url)) {
					onUploaded?.(job.uri, url);
					result.uploaded += 1;
				}
			} catch (error) {
				console.warn(`[photos] ${job.collection}/${job.id} will retry later`, error);
				result.failed += 1;
			}
		}
	}
	return result;
}
