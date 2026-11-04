import { Image, type ImageSourcePropType } from "react-native";
import { apiUrl } from "@/lib/api/client";

/** Every built-in photo the app knows about, so they can all be fetched once after install. */
const known = new Set<string>();

/**
 * A built-in photo (an exercise demo, a starter piece, a recipe, a care product). They live in
 * R2 under `static/` and come through the API (`/static/<path>`), not inside the app, so the APK
 * stays small; the phone's image cache keeps each one after its first download.
 */
export function appPhoto(path: string): ImageSourcePropType {
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
