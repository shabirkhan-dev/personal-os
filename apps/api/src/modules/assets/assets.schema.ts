import * as z from "zod";

import { settings } from "@/config/settings";

const avatarTypes = Object.keys(settings.assets.avatar.types) as [
	keyof typeof settings.assets.avatar.types,
	...(keyof typeof settings.assets.avatar.types)[],
];
const mediaTypes = Object.keys(settings.assets.media.types) as [
	keyof typeof settings.assets.media.types,
	...(keyof typeof settings.assets.media.types)[],
];

export const createUploadSchema = z.discriminatedUnion("kind", [
	z
		.object({
			kind: z.literal("avatar"),
			contentType: z.enum(avatarTypes),
			/** The file's exact size; the presigned URL only accepts a body of this length. */
			size: z.number().int().positive().max(settings.assets.avatar.maxBytes),
		})
		.strict(),
	z
		.object({
			kind: z.literal("media"),
			contentType: z.enum(mediaTypes),
			size: z.number().int().positive().max(settings.assets.media.maxBytes),
		})
		.strict(),
]);

/** Media is confirmed on its own; avatars are confirmed by saving the profile. */
export const confirmUploadSchema = z
	.object({ kind: z.literal("media"), key: z.string().min(1).max(200) })
	.strict();

export type CreateUploadInput = z.infer<typeof createUploadSchema>;
export type AssetKind = CreateUploadInput["kind"];

/** Where the app PUTs the file, and the key it sends back once the upload succeeded. */
export type UploadTicket = {
	key: string;
	uploadUrl: string;
	method: "PUT";
	headers: Record<string, string>;
	expiresAt: string;
};
