import { create } from "zustand";
import type { FoodItem, Meal, Slot } from "../lib/food-model";
import { parseMealText } from "../lib/parse-meal";
import type { FoodAnswer } from "../services/food-ai";

/** A meal on its way to the Log meal screen, from the ask bar, a photo, a voice line or a scan. */
export type MealDraft = {
	text: string;
	items: FoodItem[];
	/** Words the phone didn't know, for the Food AI. */
	unmatched: string[];
	slot: Slot | null;
	photo: string | null;
	source: "text" | "voice" | "photo" | "barcode";
	/** Logged meals this draft edits; saving replaces them. */
	replace?: Meal[];
};

type FoodUi = {
	draft: MealDraft | null;
	setDraft: (draft: MealDraft | null) => void;
	/** The last question the Food AI answered, kept while the app runs. */
	answer: (FoodAnswer & { question: string }) | null;
	setAnswer: (answer: (FoodAnswer & { question: string }) | null) => void;
	/** Bumps on each Regenerate so the plan rotates. */
	planSeed: number;
	nextSeed: () => number;
};

/** Food's screen state that outlives one screen. */
export const useFoodUi = create<FoodUi>((set, get) => ({
	draft: null,
	setDraft: (draft) => set({ draft }),
	answer: null,
	setAnswer: (answer) => set({ answer }),
	planSeed: 0,
	nextSeed: () => {
		const planSeed = get().planSeed + 1;
		set({ planSeed });
		return planSeed;
	},
}));

export const FOOD_ASK_JOB = "food:ask";
export const FOOD_READ_JOB = "food:read-meal";

/** A draft from a typed or spoken line, matched against the foods table on the phone. */
export function draftFromText(
	text: string,
	source: MealDraft["source"],
	photo: string | null = null,
): MealDraft {
	const parse = parseMealText(text);
	return { text, items: parse.items, unmatched: parse.unmatched, slot: parse.slot, photo, source };
}
