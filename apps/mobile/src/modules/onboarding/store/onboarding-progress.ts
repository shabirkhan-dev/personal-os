import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import type { OnboardingRoute } from "../lib/flow";
import { clearAnswers, loadAnswers, saveAnswers } from "./answers-storage";
import { clearDraft, loadDraft } from "./draft-storage";
import { initialAnswers, useOnboardingStore } from "./onboarding-store";

const COMPLETED_KEY = "personal-os.onboarding.completed";

type OnboardingProgress = {
	hydrated: boolean;
	completed: boolean;
	/** The step an unfinished onboarding was on, so the next launch continues there. */
	resumeRoute: OnboardingRoute | null;
	/** Reads the completed flag and the saved answers (or the unfinished draft) into the store. */
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
	resumeRoute: null,
	hydrate: async () => {
		try {
			const value = await SecureStore.getItemAsync(COMPLETED_KEY);
			const completed = value === "1";
			let resumeRoute: OnboardingRoute | null = null;
			if (completed) {
				const answers = await loadAnswers().catch((error: unknown) => {
					console.warn("[onboarding] could not read saved answers", error);
					return null;
				});
				if (answers) useOnboardingStore.setState(answers);
			} else {
				const draft = await loadDraft().catch((error: unknown) => {
					console.warn("[onboarding] could not read the unfinished onboarding", error);
					return null;
				});
				if (draft) {
					useOnboardingStore.setState(draft.answers);
					resumeRoute = draft.route;
				}
			}
			set({ completed, resumeRoute, hydrated: true });
		} catch (error) {
			// Secure storage is unavailable on web previews: treat as a first launch.
			console.warn("[onboarding] could not read progress", error);
			set({ completed: false, hydrated: true });
		}
	},
	markCompleted: async () => {
		set({ completed: true, resumeRoute: null });
		try {
			await SecureStore.setItemAsync(COMPLETED_KEY, "1");
			await saveAnswers(useOnboardingStore.getState());
			await clearDraft();
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
		useOnboardingStore.setState(initialAnswers);
		set({ completed: false, resumeRoute: null });
		try {
			await SecureStore.deleteItemAsync(COMPLETED_KEY);
			await clearAnswers();
			await clearDraft();
		} catch (error) {
			console.warn("[onboarding] could not clear progress", error);
		}
	},
}));
