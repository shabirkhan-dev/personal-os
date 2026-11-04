import { Directory, File, Paths } from "expo-file-system";

/** Where an uploaded photo's local copy is kept, named after its R2 file. */
const FOLDER = "synced-photos";

const nameOf = (url: string) => /\/([0-9a-f-]{36}\.\w+)$/i.exec(url)?.[1] ?? null;

/**
 * After an upload, keeps the photo on this phone under its R2 name, so this phone keeps showing
 * it offline. The old file has no record pointing at it any more, so it is moved, not copied.
 */
export function keepUploaded(local: string, url: string): void {
	const name = nameOf(url);
	if (!name) return;
	try {
		const folder = new Directory(Paths.document, FOLDER);
		if (!folder.exists) folder.create({ intermediates: true });
		const source = new File(local);
		if (source.exists) source.move(new File(folder, name));
	} catch (error) {
		console.warn("[photos] could not keep the local copy", error);
	}
}

/** The local copy of an uploaded photo when this phone has it, else the photo as stored. */
export function photoSource(uri: string): string {
	if (!uri.startsWith("https://")) return uri;
	const name = nameOf(uri);
	if (!name) return uri;
	try {
		const file = new File(Paths.document, FOLDER, name);
		return file.exists ? file.uri : uri;
	} catch {
		return uri;
	}
}
