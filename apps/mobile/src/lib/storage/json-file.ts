import { File, Paths } from "expo-file-system";

/**
 * Small JSON documents in the app's document directory: the logs each module keeps on the phone
 * (expenses, meals, workouts…). SecureStore is for secrets and caps value size, so it is not used
 * here.
 */
function fileFor(name: string): File {
	return new File(Paths.document, `${name}.json`);
}

/** The stored value, or `null` when nothing is saved yet or the file is not valid JSON. */
export async function readJson(name: string): Promise<unknown> {
	const file = fileFor(name);
	if (!file.exists) return null;
	const text = await file.text();
	try {
		return JSON.parse(text) as unknown;
	} catch (error) {
		console.error(`Stored ${name}.json is not valid JSON; starting fresh`, error);
		return null;
	}
}

export async function writeJson(name: string, value: unknown): Promise<void> {
	const file = fileFor(name);
	if (!file.exists) file.create({ intermediates: true });
	await file.write(JSON.stringify(value));
}

export async function deleteJson(name: string): Promise<void> {
	const file = fileFor(name);
	if (file.exists) file.delete();
}
