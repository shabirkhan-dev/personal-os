import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { newId } from "@/lib/day";

export type PhotoPick =
	| { status: "picked"; uri: string }
	| { status: "canceled" }
	| { status: "denied" }
	| { status: "unavailable" };

function photosDirectory(): Directory {
	const directory = new Directory(Paths.document, "wishlist");
	if (!directory.exists) directory.create({ intermediates: true });
	return directory;
}

/**
 * A photo for a dream or something owned, from the camera or the library, copied into the app's
 * document directory so it survives the picker's cache being cleared.
 */
export async function pickDreamPhoto(source: "camera" | "library"): Promise<PhotoPick> {
	try {
		const permission =
			source === "camera"
				? await ImagePicker.requestCameraPermissionsAsync()
				: await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) return { status: "denied" };
		const options = { mediaTypes: ["images"] as ImagePicker.MediaType[], quality: 0.7 };
		const result =
			source === "camera"
				? await ImagePicker.launchCameraAsync(options)
				: await ImagePicker.launchImageLibraryAsync(options);
		const asset = result.canceled ? null : result.assets[0];
		if (!asset) return { status: "canceled" };
		const file = new File(asset.uri);
		const copy = new File(photosDirectory(), `dream-${newId()}${file.extension || ".jpg"}`);
		await file.copy(copy);
		return { status: "picked", uri: copy.uri };
	} catch (error) {
		console.error("[wishlist] could not get a photo", error);
		return { status: "unavailable" };
	}
}

export function deleteDreamPhoto(uri: string): void {
	try {
		const file = new File(uri);
		if (file.exists) file.delete();
	} catch (error) {
		console.error("[wishlist] could not delete a photo", error);
	}
}
