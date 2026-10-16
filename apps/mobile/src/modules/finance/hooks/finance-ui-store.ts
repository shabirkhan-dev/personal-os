import { create } from "zustand";
import type { Method } from "../lib/finance-model";
import type { SpendItem } from "../lib/parse-finance-line";
import type { FinanceAnswer } from "../services/finance-ai";

export type SpendDraft = {
	text: string;
	items: SpendItem[];
	method: Method;
	receiptUri: string | null;
};

type FinanceUi = {
	/** What Log spending opens with: the ask bar's line, split, or a receipt photo. */
	draft: SpendDraft | null;
	setDraft: (draft: SpendDraft | null) => void;
	answer: (FinanceAnswer & { question: string }) | null;
	setAnswer: (answer: (FinanceAnswer & { question: string }) | null) => void;
	/** Insights notes put away this session. */
	hidden: string[];
	hide: (key: string) => void;
};

/** Finance's screen state that outlives one screen. */
export const useFinanceUi = create<FinanceUi>((set) => ({
	draft: null,
	setDraft: (draft) => set({ draft }),
	answer: null,
	setAnswer: (answer) => set({ answer }),
	hidden: [],
	hide: (key) => set((state) => ({ hidden: [...state.hidden, key] })),
}));

export const FINANCE_ASK_JOB = "finance:ask";
export const FINANCE_READ_JOB = "finance:read";
