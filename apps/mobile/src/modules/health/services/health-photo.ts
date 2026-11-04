import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { newId } from "@/lib/day";

/**
 * A photo for Health: a medicine's pack or a paper record. Kept in the app's documents until it
 * uploads to R2 with the rest of the app's photos.
 */

export type PhotoResult =
	| { status: "ok"; uri: string }
	| { status: "canceled" }
	| { status: "denied" }
	| { status: "error" };

function keep(uri: string): string {
	const folder = new Directory(Paths.document, "health-photos");
	if (!folder.exists) folder.create({ intermediates: true });
	const extension = /\.(jpe?g|png|heic|webp)$/i.exec(uri)?.[1] ?? "jpg";
	const target = new File(folder, `${newId()}.${extension.toLowerCase()}`);
	new File(uri).copy(target);
	return target.uri;
}

/** A square crop suits a pack of pills; a paper keeps its own shape so it stays readable. */
export async function healthPhoto(
	source: "camera" | "library",
	shape: "square" | "paper",
): Promise<PhotoResult> {
	try {
		const permission =
			source === "camera"
				? await ImagePicker.requestCameraPermissionsAsync()
				: await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) return { status: "denied" };
		const options: ImagePicker.ImagePickerOptions = {
			mediaTypes: ["images"],
			quality: shape === "paper" ? 0.8 : 0.6,
			allowsEditing: shape === "square",
			...(shape === "square" ? { aspect: [1, 1] as [number, number] } : {}),
		};
		const result =
			source === "camera"
				? await ImagePicker.launchCameraAsync(options)
				: await ImagePicker.launchImageLibraryAsync(options);
		const asset = result.canceled ? null : result.assets[0];
		if (!asset) return { status: "canceled" };
		return { status: "ok", uri: keep(asset.uri) };
	} catch (error) {
		console.error(`[health] photo from ${source} failed`, error);
		return { status: "error" };
	}
}

/** Removes a photo the app kept on this phone; fine to call for one already gone. */
export function forgetHealthPhoto(uri: string | null): void {
	if (!uri?.startsWith("file://")) return;
	try {
		const file = new File(uri);
		if (file.exists) file.delete();
	} catch (error) {
		console.warn("[health] could not remove a photo", error);
	}
}
