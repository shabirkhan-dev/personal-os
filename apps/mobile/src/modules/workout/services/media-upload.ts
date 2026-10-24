import { ApiError, apiClient } from "@/lib/api/client";

export const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];
const MAX_BYTES = 15 * 1024 * 1024;

type UploadTicket = {
	key: string;
	uploadUrl: string;
	method: "PUT";
	headers: Record<string, string>;
};

/** The upload type for a picked file, from its MIME type or file name. */
export function mediaTypeOf(mimeType: string | null | undefined, uri: string): MediaType | null {
	const type = (mimeType ?? "").toLowerCase();
	if ((MEDIA_TYPES as readonly string[]).includes(type)) return type as MediaType;
	const ext = /\.(\w+)(?:\?|$)/.exec(uri)?.[1]?.toLowerCase();
	if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
	if (ext === "png" || ext === "webp" || ext === "gif") return `image/${ext}` as MediaType;
	return null;
}

/**
 * Uploads an exercise photo or animation straight to R2 (`POST /assets/uploads` with the `media`
 * kind, then the presigned PUT) and confirms it, returning the public URL to store.
 */
export async function uploadMedia(
	accessToken: string,
	file: { uri: string; type: MediaType },
): Promise<string> {
	const body = await (await fetch(file.uri)).blob();
	if (body.size > MAX_BYTES) {
		throw new ApiError("That file is over 15 MB. Pick a smaller one.", 400, "MEDIA_TOO_BIG");
	}
	const ticket = await apiClient.post<UploadTicket>(
		"/assets/uploads",
		{ kind: "media", contentType: file.type, size: body.size },
		{ accessToken },
	);
	const upload = await fetch(ticket.uploadUrl, {
		method: ticket.method,
		headers: ticket.headers,
		body,
	});
	if (!upload.ok) {
		throw new ApiError(
			"The file could not be uploaded. Try again.",
			upload.status,
			"UPLOAD_FAILED",
		);
	}
	const confirmed = await apiClient.post<{ key: string; url: string }>(
		"/assets/confirm",
		{ kind: "media", key: ticket.key },
		{ accessToken },
	);
	return confirmed.url;
}
