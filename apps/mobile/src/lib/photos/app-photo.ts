import { Image, type ImageSourcePropType } from "react-native";
import { apiUrl } from "@/lib/api/client";
import { BUNDLED_PHOTOS } from "./bundled-photos";

/** Every built-in photo the app knows about, so they can all be fetched once after install. */
const known = new Set<string>();

/**
 * A built-in photo (an exercise demo, a template piece, a recipe, a care product). They ship
 * inside the app (`bundled-photos.ts`, about 2 MB), so they show offline and never depend on the
 * bucket. A path that isn't bundled still loads from R2 through the API (`/static/<path>`).
 */
export function appPhoto(path: string): ImageSourcePropType {
	// Shipped inside the app: always there, offline, with nothing to upload.
	const bundled = BUNDLED_PHOTOS[path];
	if (bundled) return bundled;
	known.add(path);
	const url = apiUrl(`/static/${path}`);
	return url ? { uri: url } : {};
}

/**
 * Downloads every built-in photo into the image cache, so Training's demos work at a gym with no
 * signal. Cheap after the first time: cached photos are not fetched again.
 */
export async function prefetchAppPhotos(): Promise<number> {
	let fetched = 0;
	for (const path of known) {
		const url = apiUrl(`/static/${path}`);
		if (!url) return fetched;
		try {
			// oxlint-disable-next-line eslint/no-await-in-loop -- one at a time on a phone connection
			if (await Image.prefetch(url)) fetched += 1;
		} catch (error) {
			console.warn(`[photos] could not fetch ${path}`, error);
		}
	}
	return fetched;
}
