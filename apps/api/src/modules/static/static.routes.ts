import { Hono } from "hono";

import type { AppEnv } from "@/core/context";
import { AppError } from "@/core/app-error";

/** The bucket folder the app's built-in photos are uploaded to (`scripts/upload-app-photos.sh`). */
export const STATIC_PREFIX = "static/";

/** Paths such as `training/push-up.webp`: lowercase words, one level or more, a known image type. */
const PATH = /^(?:[a-z0-9][a-z0-9-]*\/)+[a-z0-9][a-z0-9._-]*\.(?:webp|png|jpg|gif)$/;

/**
 * The app's built-in photos (exercise demos, starter clothes, recipes, care products), served
 * from R2 instead of shipping in the APK. Public and the same for everyone, so they are cached
 * for a year: a changed photo gets a new file name.
 */
export const staticRoutes = new Hono<AppEnv>().get("/*", async (c) => {
	const path = c.req.path.replace(/^.*?\/static\//, "");
	if (!PATH.test(path)) throw new AppError("NOT_FOUND");
	const bucket = c.env.ASSETS;
	if (!bucket) throw new AppError("ASSETS_UNAVAILABLE");
	const object = await bucket.get(`${STATIC_PREFIX}${path}`);
	if (!object) throw new AppError("NOT_FOUND");
	return new Response(object.body, {
		headers: {
			"Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
			"Cache-Control": "public, max-age=31536000, immutable",
			ETag: object.httpEtag,
		},
	});
});
