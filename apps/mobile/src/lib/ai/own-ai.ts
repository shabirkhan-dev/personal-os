import { create } from "zustand";
import { deleteItemAsync, getItemAsync, setItemAsync } from "@/lib/secure-store";
import { type OwnAi, parseOwnAi } from "./own-ai-config";

export {
	maskKey,
	OWN_AI_PROVIDERS,
	type OwnAi,
	type OwnAiProvider,
	ownAiConfig,
	parseOwnAi,
} from "./own-ai-config";

/**
 * The person's own AI key. It lives in the phone's keystore (Android Keystore, iOS Keychain), is
 * never synced, never sent to the Personal OS server and never put in a backup: AI tasks call
 * the provider straight from the phone with it.
 */

const STORE_KEY = "own-ai";

type OwnAiState = {
	hydrated: boolean;
	own: OwnAi | null;
	hydrate: () => Promise<void>;
	save: (own: OwnAi) => Promise<void>;
	clear: () => Promise<void>;
};

export const useOwnAi = create<OwnAiState>((set, get) => ({
	hydrated: false,
	own: null,
	hydrate: async () => {
		if (get().hydrated) return;
		try {
			set({ own: parseOwnAi(await getItemAsync(STORE_KEY)), hydrated: true });
		} catch (error) {
			console.warn("[ai] could not read the saved key", error);
			set({ hydrated: true });
		}
	},
	save: async (own) => {
		await setItemAsync(STORE_KEY, JSON.stringify(own));
		set({ own });
	},
	clear: async () => {
		await deleteItemAsync(STORE_KEY);
		set({ own: null });
	},
}));
