import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

export type PhotoResult =
	| { status: "taken"; uri: string }
	| { status: "cancelled" }
	| { status: "denied" }
	| { status: "failed" };

/**
 * Opens the camera for today's skin photo and keeps a copy in the app's document folder (the
 * picker's own file lives in a cache the system may clear).
 */
export async function takeSkinPhoto(day: string): Promise<PhotoResult> {
	try {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) return { status: "denied" };
		const result = await ImagePicker.launchCameraAsync({
			mediaTypes: ["images"],
			quality: 0.7,
			cameraType: ImagePicker.CameraType.front,
		});
		const asset = result.canceled ? null : result.assets[0];
		if (!asset) return { status: "cancelled" };
		const folder = new Directory(Paths.document, "skincare-photos");
		if (!folder.exists) folder.create({ intermediates: true });
		const extension = asset.uri.split(".").pop()?.toLowerCase() === "png" ? "png" : "jpg";
		const target = new File(folder, `${day}-${Date.now().toString(36)}.${extension}`);
		await new File(asset.uri).copy(target);
		return { status: "taken", uri: target.uri };
	} catch (error) {
		console.error("Could not take the skin photo", error);
		return { status: "failed" };
	}
}
