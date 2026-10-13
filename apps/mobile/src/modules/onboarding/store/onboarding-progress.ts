import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const COMPLETED_KEY = "personal-os.onboarding.completed";

type OnboardingProgress = {
	hydrated: boolean;
	completed: boolean;
	hydrate: () => Promise<void>;
	markCompleted: () => Promise<void>;
	/** Clears the flag so the next launch replays onboarding. */
	restart: () => Promise<void>;
};

/** Persisted "onboarding finished" flag that gates the main app. */
export const useOnboardingProgress = create<OnboardingProgress>()((set) => ({
	hydrated: false,
	completed: false,
	hydrate: async () => {
		try {
			const value = await SecureStore.getItemAsync(COMPLETED_KEY);
			set({ completed: value === "1", hydrated: true });
		} catch (error) {
			// Secure storage is unavailable on web previews: treat as a first launch.
			console.warn("[onboarding] could not read progress", error);
			set({ completed: false, hydrated: true });
		}
	},
	markCompleted: async () => {
		set({ completed: true });
		try {
			await SecureStore.setItemAsync(COMPLETED_KEY, "1");
		} catch (error) {
			console.warn("[onboarding] could not save progress", error);
		}
	},
	restart: async () => {
		set({ completed: false });
		try {
			await SecureStore.deleteItemAsync(COMPLETED_KEY);
		} catch (error) {
			console.warn("[onboarding] could not clear progress", error);
		}
	},
}));
