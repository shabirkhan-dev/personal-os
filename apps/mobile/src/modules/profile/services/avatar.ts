import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { ApiError } from "@/lib/api/client";
import { newId } from "@/lib/day";
import { usersService } from "@/modules/users/services/users.service";
import type { AvatarType, User } from "@/modules/users/types/user.types";
import { useAvatarStore } from "../store/avatar-store";

/** Picking, keeping and uploading the person's photo. */

export type PickResult = "ok" | "canceled" | "denied" | "error";

function keep(uri: string): string {
	const folder = new Directory(Paths.document, "avatar");
	if (!folder.exists) folder.create({ intermediates: true });
	for (const old of folder.list()) {
		if (old instanceof File) old.delete();
	}
	const target = new File(folder, `${newId()}.jpg`);
	new File(uri).copy(target);
	return target.uri;
}

/** Picks a square photo and shows it at once; the upload follows separately. */
export async function pickAvatar(source: "camera" | "library"): Promise<PickResult> {
	try {
		const permission =
			source === "camera"
				? await ImagePicker.requestCameraPermissionsAsync()
				: await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) return "denied";
		const options: ImagePicker.ImagePickerOptions = {
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.7,
		};
		const result =
			source === "camera"
				? await ImagePicker.launchCameraAsync(options)
				: await ImagePicker.launchImageLibraryAsync(options);
		const asset = result.canceled ? null : result.assets[0];
		if (!asset) return "canceled";
		const uri = keep(asset.uri);
		useAvatarStore.getState().update(() => ({ uri, pending: true }));
		return "ok";
	} catch (error) {
		console.error(`[profile] avatar from ${source} failed`, error);
		return "error";
	}
}

export function removeLocalAvatar(): void {
	useAvatarStore.getState().update(() => ({ uri: null, pending: false }));
}

export type UploadOutcome =
	| { status: "uploaded"; user: User }
	| { status: "later"; reason: "offline" | "storage-off" | "failed" };

/** Uploads the pending photo to the account. The photo stays on the phone whatever happens. */
export async function uploadPendingAvatar(token: string): Promise<UploadOutcome | null> {
	const { uri, pending } = useAvatarStore.getState().data;
	if (!uri || !pending) return null;
	const type: AvatarType = /\.png$/i.test(uri) ? "image/png" : "image/jpeg";
	try {
		const user = await usersService.uploadAvatar(token, { uri, type });
		useAvatarStore
			.getState()
			.update((current) => (current.uri === uri ? { ...current, pending: false } : current));
		return { status: "uploaded", user };
	} catch (error) {
		if (error instanceof ApiError && error.code === "ASSETS_UNAVAILABLE") {
			return { status: "later", reason: "storage-off" };
		}
		if (error instanceof ApiError && error.statusCode === 0)
			return { status: "later", reason: "offline" };
		console.warn("[profile] avatar upload failed", error);
		return { status: "later", reason: "failed" };
	}
}
