import { useEffect } from "react";
import { prefetchAppPhotos } from "@/lib/photos/app-photo";

/**
 * A few seconds after launch, makes sure every built-in photo is in the image cache, so they
 * show offline later. Once per launch; photos already cached are not downloaded again.
 */
export function usePrefetchAppPhotos(): void {
	useEffect(() => {
		const timer = setTimeout(() => {
			prefetchAppPhotos().catch((error: unknown) =>
				console.warn("[photos] built-in photos will load when shown", error),
			);
		}, 5_000);
		return () => clearTimeout(timer);
	}, []);
}
