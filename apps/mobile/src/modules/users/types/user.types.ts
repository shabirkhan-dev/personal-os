/** The account, as `GET /users/me` returns it. */
export interface User {
	id: string;
	email: string;
	displayName: string | null;
	avatarUrl: string | null;
	createdAt: string;
}

export interface UpdateUserProfileInput {
	displayName?: string | null;
	/** The key from an upload ticket, once the file is in R2; null removes the avatar. */
	avatarKey?: string | null;
}

export type AvatarType = "image/jpeg" | "image/png" | "image/webp";

/** Where to PUT the file (straight to R2), and the key to save afterwards. */
export interface UploadTicket {
	key: string;
	uploadUrl: string;
	method: "PUT";
	headers: Record<string, string>;
	expiresAt: string;
}
