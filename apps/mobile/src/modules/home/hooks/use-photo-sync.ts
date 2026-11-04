import { useEffect, useRef } from "react";
import { getRecordStore } from "@/lib/db/database";
import { keepUploaded } from "@/lib/photos/local-photo";
import { mediaTypeOf, uploadMedia } from "@/lib/photos/media-upload";
import { syncPhotos } from "@/lib/photos/photo-sync";
import { useSync } from "@/lib/sync/sync-provider";
import { useAuth } from "@/modules/auth";
import { PHOTO_TARGETS } from "../lib/photo-targets";

/**
 * While signed in, uploads the photos that are only on this phone after each sync, so pieces,
 * meals and dreams keep their photos on a new phone. Runs one pass at a time.
 */
export function usePhotoSync(): void {
	const { status, token } = useAuth();
	const { lastSyncedAt } = useSync();
	const running = useRef(false);

	useEffect(() => {
		if (status !== "signed-in" || !token || !lastSyncedAt || running.current) return;
		running.current = true;
		const upload = async (uri: string) => {
			const type = mediaTypeOf(null, uri);
			if (!type) throw new Error(`Not an uploadable image: ${uri}`);
			return uploadMedia(token, { uri, type });
		};
		getRecordStore()
			.then((store) => syncPhotos(PHOTO_TARGETS, upload, store, keepUploaded))
			.then((result) => {
				if (result.uploaded > 0) console.info(`[photos] uploaded ${result.uploaded}`);
			})
			.catch((error: unknown) => console.warn("[photos] will retry after the next sync", error))
			.finally(() => {
				running.current = false;
			});
	}, [status, token, lastSyncedAt]);
}
