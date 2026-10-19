import { AwsClient } from "aws4fetch";

import type { Config } from "@/config/env";
import { settings } from "@/config/settings";
import { AppError } from "@/core/app-error";
import type { AssetKind, CreateUploadInput, UploadTicket } from "./assets.schema";

const PREFIX: Record<AssetKind, string> = { avatar: "avatars" };

/**
 * A presigned R2 URL the app uploads to directly; the file never passes through the API. The
 * signature covers the content type and length, so R2 refuses any other type or a bigger file.
 */
export async function createUpload(
	config: Config,
	userId: string,
	input: CreateUploadInput,
	now = new Date(),
): Promise<UploadTicket> {
	const r2 = config.r2;
	if (!r2) throw new AppError("ASSETS_UNAVAILABLE");
	const extension = settings.assets.avatar.types[input.contentType];
	const key = `${PREFIX[input.kind]}/${userId}/${crypto.randomUUID()}.${extension}`;
	const url = new URL(`https://${r2.accountId}.r2.cloudflarestorage.com/${r2.bucket}/${key}`);
	url.searchParams.set("X-Amz-Expires", String(settings.assets.uploadTtlSeconds));

	const client = new AwsClient({
		accessKeyId: r2.accessKeyId,
		secretAccessKey: r2.secretAccessKey,
		service: "s3",
		region: "auto",
	});
	const headers = { "Content-Type": input.contentType, "Content-Length": String(input.size) };
	const signed = await client.sign(new Request(url, { method: "PUT", headers }), {
		aws: { signQuery: true, allHeaders: true, datetime: toAmzDate(now) },
	});
	return {
		key,
		uploadUrl: signed.url,
		method: "PUT",
		headers,
		expiresAt: new Date(now.getTime() + settings.assets.uploadTtlSeconds * 1000).toISOString(),
	};
}

/**
 * Checks an uploaded object before the API points at it: it must sit under the caller's prefix
 * and be an image of an allowed type and size. A bad file is deleted.
 */
export async function confirmUpload(
	bucket: R2Bucket | undefined,
	userId: string,
	kind: AssetKind,
	key: string,
): Promise<void> {
	if (!bucket) throw new AppError("ASSETS_UNAVAILABLE");
	const pattern = new RegExp(`^${PREFIX[kind]}/${userId}/[0-9a-f-]{36}\\.(jpg|png|webp)$`);
	if (!pattern.test(key)) throw new AppError("ASSET_INVALID");

	const object = await bucket.head(key);
	if (!object) throw new AppError("ASSET_NOT_UPLOADED");
	const type = object.httpMetadata?.contentType ?? "";
	if (object.size > settings.assets.avatar.maxBytes || !(type in settings.assets.avatar.types)) {
		await bucket.delete(key);
		throw new AppError("ASSET_INVALID");
	}
}

/** Removes a replaced file; a failure only leaves an orphan behind, so it is logged. */
export async function deleteAsset(bucket: R2Bucket | undefined, key: string): Promise<void> {
	try {
		await bucket?.delete(key);
	} catch (error) {
		console.warn(`[assets] could not delete ${key}`, error);
	}
}

/** Deletes every object under a user's prefix: their avatar and any upload never confirmed. */
export async function deleteUserAssets(
	bucket: R2Bucket | undefined,
	userId: string,
): Promise<void> {
	if (!bucket) return;
	for (const kind of Object.values(PREFIX)) {
		let cursor: string | undefined;
		do {
			// oxlint-disable-next-line eslint/no-await-in-loop -- R2 lists one page at a time
			const page = await bucket.list({ prefix: `${kind}/${userId}/`, cursor });
			const keys = page.objects.map((object) => object.key);
			// oxlint-disable-next-line eslint/no-await-in-loop
			if (keys.length > 0) await bucket.delete(keys);
			cursor = page.truncated ? page.cursor : undefined;
		} while (cursor);
	}
}

export function assetUrl(config: Config, key: string): string | null {
	return config.r2 ? `${config.r2.publicUrl}/${key}` : null;
}

function toAmzDate(date: Date): string {
	return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}
