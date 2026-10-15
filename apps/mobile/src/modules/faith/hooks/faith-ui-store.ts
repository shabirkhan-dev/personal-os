import { create } from "zustand";
import type { FaithAnswer } from "../services/faith-ai";

export type FaithSheet = "reminders" | "setup" | "log";

type FaithUi = {
	sheet: FaithSheet | null;
	openSheet: (sheet: FaithSheet) => void;
	closeSheet: () => void;
	/** The last question the Faith AI answered, kept while the app runs. */
	answer: (FaithAnswer & { question: string }) | null;
	setAnswer: (answer: (FaithAnswer & { question: string }) | null) => void;
	/** Moment cards the person finished today ("2026-10-15:wake"). */
	momentsDone: string[];
	finishMoment: (id: string) => void;
	/** How far "Another" moved the ayah of the day. */
	ayahOffset: number;
	nextAyah: () => void;
};

/** Faith's screen state that outlives one screen: open sheets, the AI answer, moment cards. */
export const useFaithUi = create<FaithUi>((set) => ({
	sheet: null,
	openSheet: (sheet) => set({ sheet }),
	closeSheet: () => set({ sheet: null }),
	answer: null,
	setAnswer: (answer) => set({ answer }),
	momentsDone: [],
	finishMoment: (id) => set((state) => ({ momentsDone: [...state.momentsDone, id] })),
	ayahOffset: 0,
	nextAyah: () => set((state) => ({ ayahOffset: state.ayahOffset + 1 })),
}));

export const FAITH_ASK_JOB = "faith:ask";
