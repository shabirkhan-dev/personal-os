import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { newId } from "@/lib/day";

export type PhotoResult =
	| { status: "ok"; uri: string }
	| { status: "canceled" }
	| { status: "denied" }
	| { status: "error" };

/** Copies a picked photo out of the picker's cache into the app's documents so it stays. */
function keep(uri: string): string {
	const folder = new Directory(Paths.document, "meal-photos");
	if (!folder.exists) folder.create({ intermediates: true });
	const extension = /\.(jpe?g|png|heic|webp)$/i.exec(uri)?.[1] ?? "jpg";
	const target = new File(folder, `${newId()}.${extension.toLowerCase()}`);
	new File(uri).copy(target);
	return target.uri;
}

async function pick(source: "camera" | "library"): Promise<PhotoResult> {
	try {
		const permission =
			source === "camera"
				? await ImagePicker.requestCameraPermissionsAsync()
				: await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (!permission.granted) return { status: "denied" };
		const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.6 };
		const result =
			source === "camera"
				? await ImagePicker.launchCameraAsync(options)
				: await ImagePicker.launchImageLibraryAsync(options);
		const asset = result.canceled ? null : result.assets[0];
		if (!asset) return { status: "canceled" };
		return { status: "ok", uri: keep(asset.uri) };
	} catch (error) {
		console.error(`Meal photo from ${source} failed`, error);
		return { status: "error" };
	}
}

export function takeMealPhoto(): Promise<PhotoResult> {
	return pick("camera");
}

export function chooseMealPhoto(): Promise<PhotoResult> {
	return pick("library");
}
