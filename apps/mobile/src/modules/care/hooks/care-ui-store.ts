import { create } from "zustand";
import type { Routine } from "../lib/care-model";
import type { CareAnswer } from "../services/care-ai";

type CareUi = {
	/** The Morning / Night toggle on Home; null follows the time of day. */
	routine: Routine | null;
	setRoutine: (routine: Routine | null) => void;
	/** The last question the Care AI answered, kept while the app runs. */
	answer: (CareAnswer & { question: string }) | null;
	setAnswer: (answer: (CareAnswer & { question: string }) | null) => void;
};

/** Care's screen state that outlives one screen. */
export const useCareUi = create<CareUi>((set) => ({
	routine: null,
	setRoutine: (routine) => set({ routine }),
	answer: null,
	setAnswer: (answer) => set({ answer }),
}));

export const CARE_ASK_JOB = "care:ask";
