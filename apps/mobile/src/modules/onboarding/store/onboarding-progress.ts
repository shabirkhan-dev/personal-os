import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { clearAnswers, loadAnswers, saveAnswers } from "./answers-storage";
import { useOnboardingStore } from "./onboarding-store";

const COMPLETED_KEY = "personal-os.onboarding.completed";

type OnboardingProgress = {
	hydrated: boolean;
	completed: boolean;
	/** Reads the completed flag and, when set, the saved answers into the onboarding store. */
	hydrate: () => Promise<void>;
	/** Marks onboarding finished and saves the current answers. */
	markCompleted: () => Promise<void>;
	/** Saves the current answers after they change outside onboarding (e.g. modules on Home). */
	persistAnswers: () => Promise<void>;
	/** Clears the flag and the answers so the next launch replays onboarding. */
	restart: () => Promise<void>;
};

/** Persisted "onboarding finished" flag that gates the main app. */
export const useOnboardingProgress = create<OnboardingProgress>()((set) => ({
	hydrated: false,
	completed: false,
	hydrate: async () => {
		try {
			const value = await SecureStore.getItemAsync(COMPLETED_KEY);
			const completed = value === "1";
			if (completed) {
				const answers = await loadAnswers().catch((error: unknown) => {
					console.warn("[onboarding] could not read saved answers", error);
					return null;
				});
				if (answers) useOnboardingStore.setState(answers);
			}
			set({ completed, hydrated: true });
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
			await saveAnswers(useOnboardingStore.getState());
		} catch (error) {
			console.warn("[onboarding] could not save progress", error);
		}
	},
	persistAnswers: async () => {
		try {
			await saveAnswers(useOnboardingStore.getState());
		} catch (error) {
			console.warn("[onboarding] could not save answers", error);
		}
	},
	restart: async () => {
		set({ completed: false });
		try {
			await SecureStore.deleteItemAsync(COMPLETED_KEY);
			await clearAnswers();
		} catch (error) {
			console.warn("[onboarding] could not clear progress", error);
		}
	},
}));
