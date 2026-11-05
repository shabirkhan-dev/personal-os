import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { newId } from "@/lib/day";

/**
 * A photo from the camera or the gallery, copied into the app's documents (`folder`) so it stays
 * on the phone until it uploads to R2 with the rest of the app's photos.
 */

export type PickedPhoto =
	| { status: "ok"; uri: string }
	| { status: "canceled" }
	| { status: "denied" }
	| { status: "error" };

function keep(uri: string, folder: string): string {
	const directory = new Directory(Paths.document, folder);
	if (!directory.exists) directory.create({ intermediates: true });
	const extension = /\.(jpe?g|png|heic|webp)$/i.exec(uri)?.[1] ?? "jpg";
	const target = new File(directory, `${newId()}.${extension.toLowerCase()}`);
	new File(uri).copy(target);
	return target.uri;
}

export async function pickPhoto(
	source: "camera" | "library",
	folder: string,
	aspect: [number, number] | null = [1, 1],
): Promise<PickedPhoto> {
	try {
		const permission =
			source === "camera"
				? await ImagePicker.requestCameraPermissionsAsync()
				: await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) return { status: "denied" };
		const options: ImagePicker.ImagePickerOptions = {
			mediaTypes: ["images"],
			quality: 0.7,
			allowsEditing: aspect !== null,
			...(aspect ? { aspect } : {}),
		};
		const result =
			source === "camera"
				? await ImagePicker.launchCameraAsync(options)
				: await ImagePicker.launchImageLibraryAsync(options);
		const asset = result.canceled ? null : result.assets[0];
		if (!asset) return { status: "canceled" };
		return { status: "ok", uri: keep(asset.uri, folder) };
	} catch (error) {
		console.error(`[photos] photo from ${source} failed`, error);
		return { status: "error" };
	}
}

/** Removes a photo the app kept on this phone; fine to call for one already gone or uploaded. */
export function forgetLocalPhoto(uri: string | null | undefined): void {
	if (!uri?.startsWith("file://")) return;
	try {
		const file = new File(uri);
		if (file.exists) file.delete();
	} catch (error) {
		console.warn("[photos] could not remove a photo", error);
	}
}

export const PHOTO_MESSAGES = {
	denied: "This needs camera or photo access. You can allow it in Settings.",
	error: "Couldn't get that photo. Try again.",
} as const;
