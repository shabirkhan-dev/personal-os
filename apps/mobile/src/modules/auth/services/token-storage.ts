import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "personal-os.auth.refreshToken";

/** Refresh token in the device keychain. Throws when secure storage is unavailable. */
export const tokenStorage = {
	getRefreshToken: (): Promise<string | null> => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
	setRefreshToken: async (token: string | null): Promise<void> => {
		if (token === null) {
			await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
			return;
		}
		await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
	},
};
