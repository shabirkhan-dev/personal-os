import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const REFRESH_TOKEN_KEY = "personal-os.auth.refreshToken";

async function setRefreshTokenValue(value: string | null): Promise<void> {
	if (Platform.OS === "web") {
		const storage = globalThis.sessionStorage;
		if (!storage) {
			return;
		}
		if (value === null) {
			storage.removeItem(REFRESH_TOKEN_KEY);
			return;
		}
		// Expo web has no SecureStore; session-scoped storage until cookie bridge exists.
		// codeql[js/clear-text-storage-of-sensitive-data]
		storage.setItem(REFRESH_TOKEN_KEY, value);
		return;
	}
	if (value === null) {
		await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
		return;
	}
	await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, value);
}

async function getRefreshTokenValue(): Promise<string | null> {
	if (Platform.OS === "web") {
		return globalThis.sessionStorage?.getItem(REFRESH_TOKEN_KEY) ?? null;
	}
	return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export const tokenStorage = {
	getRefreshToken: () => getRefreshTokenValue(),
	setRefreshToken: (token: string | null) => setRefreshTokenValue(token),
};
