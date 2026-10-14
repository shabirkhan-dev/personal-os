import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { newId } from "@/lib/day";

export type ReceiptCapture =
	| { status: "captured"; uri: string }
	| { status: "canceled" }
	| { status: "denied" }
	| { status: "unavailable" };

function receiptsDirectory(): Directory {
	const directory = new Directory(Paths.document, "receipts");
	if (!directory.exists) directory.create({ intermediates: true });
	return directory;
}

/**
 * Opens the camera for a receipt photo and copies it into the app's document directory, so it
 * survives the picker's cache being cleared. The amount is still typed by the person.
 */
export async function captureReceiptPhoto(): Promise<ReceiptCapture> {
	try {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) return { status: "denied" };

		const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.6 });
		const asset = result.canceled ? null : result.assets[0];
		if (!asset) return { status: "canceled" };

		const source = new File(asset.uri);
		const extension = source.extension || ".jpg";
		const destination = new File(receiptsDirectory(), `receipt-${newId()}${extension}`);
		await source.copy(destination);
		return { status: "captured", uri: destination.uri };
	} catch (error) {
		console.error("Could not capture a receipt photo", error);
		return { status: "unavailable" };
	}
}

/** Deletes a stored receipt photo (when an expense with one is removed). */
export function deleteReceiptPhoto(uri: string): void {
	try {
		const file = new File(uri);
		if (file.exists) file.delete();
	} catch (error) {
		console.error("Could not delete a receipt photo", error);
	}
}
