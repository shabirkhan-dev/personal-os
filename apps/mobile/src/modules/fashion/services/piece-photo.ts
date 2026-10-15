import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { newId } from "@/lib/day";

/** A photo of a piece, from the camera or the gallery, kept in the app's documents. */

export type PhotoResult =
	| { status: "ok"; uri: string }
	| { status: "canceled" }
	| { status: "denied" }
	| { status: "error" };

function keep(uri: string): string {
	const folder = new Directory(Paths.document, "fashion-photos");
	if (!folder.exists) folder.create({ intermediates: true });
	const extension = /\.(jpe?g|png|heic|webp)$/i.exec(uri)?.[1] ?? "jpg";
	const target = new File(folder, `${newId()}.${extension.toLowerCase()}`);
	new File(uri).copy(target);
	return target.uri;
}

export async function piecePhoto(source: "camera" | "library"): Promise<PhotoResult> {
	try {
		const permission =
			source === "camera"
				? await ImagePicker.requestCameraPermissionsAsync()
				: await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) return { status: "denied" };
		const options: ImagePicker.ImagePickerOptions = {
			mediaTypes: ["images"],
			quality: 0.7,
			allowsEditing: true,
			aspect: [1, 1],
		};
		const result =
			source === "camera"
				? await ImagePicker.launchCameraAsync(options)
				: await ImagePicker.launchImageLibraryAsync(options);
		const asset = result.canceled ? null : result.assets[0];
		if (!asset) return { status: "canceled" };
		return { status: "ok", uri: keep(asset.uri) };
	} catch (error) {
		console.error(`[fashion] photo from ${source} failed`, error);
		return { status: "error" };
	}
}
