import type { Config } from "@/config/env";
import { AppError } from "@/core/app-error";
import type { Database } from "@/db/client";
import type { UserRow } from "@/db/schema";
import {
	assetUrl,
	confirmUpload,
	deleteAsset,
	deleteUserAssets,
} from "@/modules/assets/assets.service";
import { deleteUser, findUserById, updateUser } from "./users.repository";
import type { PublicUser, UpdateProfileInput } from "./users.schema";

export function toPublicUser(config: Config, user: UserRow): PublicUser {
	return {
		id: user.id,
		email: user.email,
		displayName: user.displayName,
		avatarUrl: user.avatarKey ? assetUrl(config, user.avatarKey) : null,
		createdAt: user.createdAt.toISOString(),
	};
}

export async function getCurrentUser(
	db: Database,
	config: Config,
	userId: string,
): Promise<PublicUser> {
	const user = await findUserById(db, userId);
	if (!user?.isActive) throw new AppError("AUTH_SESSION_INVALID");
	return toPublicUser(config, user);
}

/** Saves the profile. A new avatar must already be in R2, under this user's prefix. */
export async function updateProfile(
	db: Database,
	config: Config,
	bucket: R2Bucket | undefined,
	userId: string,
	input: UpdateProfileInput,
): Promise<PublicUser> {
	const current = await findUserById(db, userId);
	if (!current?.isActive) throw new AppError("AUTH_SESSION_INVALID");
	if (input.avatarKey) await confirmUpload(bucket, userId, "avatar", input.avatarKey);
	const user = await updateUser(db, userId, input);
	if (!user) throw new AppError("AUTH_SESSION_INVALID");
	if (input.avatarKey !== undefined && current.avatarKey && current.avatarKey !== user.avatarKey) {
		await deleteAsset(bucket, current.avatarKey);
	}
	return toPublicUser(config, user);
}

/**
 * Deletes the account and everything stored for it: the database rows, then the files in R2.
 * The data on the phone is the app's to clear. Signing in again with the email starts afresh.
 */
export async function deleteAccount(
	db: Database,
	bucket: R2Bucket | undefined,
	userId: string,
): Promise<void> {
	const user = await findUserById(db, userId);
	if (!user) throw new AppError("AUTH_SESSION_INVALID");
	await deleteUser(db, user);
	try {
		await deleteUserAssets(bucket, userId);
	} catch (error) {
		console.error(`[users] deleted ${userId} but not all of their files`, error);
	}
}
