import { create } from "zustand";
import type { FashionAnswer } from "../services/fashion-ai";

type FashionUi = {
	/** Which of today's looks the Home card shows. */
	lookIndex: number;
	nextLook: (count: number) => void;
	/** The last question the Fashion AI answered, kept while the app runs. */
	answer: (FashionAnswer & { question: string }) | null;
	setAnswer: (answer: (FashionAnswer & { question: string }) | null) => void;
	/** Text handed to Add piece from the ask bar ("add navy blazer 18000"). */
	draft: string;
	setDraft: (draft: string) => void;
};

/** Fashion's screen state that outlives one screen. */
export const useFashionUi = create<FashionUi>((set) => ({
	lookIndex: 0,
	nextLook: (count) =>
		set((state) => ({ lookIndex: count > 0 ? (state.lookIndex + 1) % count : 0 })),
	answer: null,
	setAnswer: (answer) => set({ answer }),
	draft: "",
	setDraft: (draft) => set({ draft }),
}));

export const FASHION_ASK_JOB = "fashion:ask";
