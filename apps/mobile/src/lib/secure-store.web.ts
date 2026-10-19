/**
 * The web preview's stand-in for expo-secure-store, which has no web implementation: the same
 * three calls on `localStorage`. The browser offers no keychain, so this is for previews, not a
 * place to keep real secrets.
 */

function storage(): Storage | null {
	try {
		return globalThis.localStorage ?? null;
	} catch (error) {
		console.warn("[secure-store] localStorage is not available", error);
		return null;
	}
}

export async function getItemAsync(key: string): Promise<string | null> {
	return storage()?.getItem(key) ?? null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
	storage()?.setItem(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
	storage()?.removeItem(key);
}
