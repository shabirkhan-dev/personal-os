import { create } from "zustand";
import { saveSettings } from "../data/faith-actions";
import type { FaithSettings } from "../lib/faith-model";
import {
	currentPlace,
	LOCATE_FAILURE_MESSAGE,
	LOCATE_STAGE_LABEL,
	type LocateStage,
} from "../services/location";
import { requestReminderPermission } from "../services/prayer-reminders";

type LocateState = {
	stage: LocateStage | null;
	error: string | null;
	/** The person's place last found, for "Times for Gilgit" while settings catch up. */
	found: string | null;
	/** Finds the person, then saves the place into `settings`. One run at a time. */
	locate: (settings: FaithSettings) => Promise<boolean>;
	clearError: () => void;
};

/**
 * Finding the person's location, shared by every Faith screen, so the setup card, the sheets and
 * the Qibla all show the same step ("Finding where you are…") and the same error.
 */
export const useLocate = create<LocateState>((set, get) => ({
	stage: null,
	error: null,
	found: null,
	clearError: () => set({ error: null }),
	locate: async (settings) => {
		if (get().stage !== null) return false;
		set({ stage: "asking", error: null });
		try {
			const result = await currentPlace((stage) => set({ stage }));
			if (!result.ok) {
				set({ error: LOCATE_FAILURE_MESSAGE[result.reason] });
				return false;
			}
			await saveSettings({ ...settings, setUp: true, place: result.place });
			set({ found: result.place.name });
			requestReminderPermission().catch((error: unknown) =>
				console.warn("[faith] could not ask for notifications", error),
			);
			return true;
		} catch (error) {
			console.error("[faith] could not save the location", error);
			set({ error: "Found you, but couldn't save it on this phone. Try again." });
			return false;
		} finally {
			set({ stage: null });
		}
	},
}));

/** "Finding where you are…" while locating, else null. */
export function locateLabel(stage: LocateStage | null): string | null {
	return stage ? LOCATE_STAGE_LABEL[stage] : null;
}
