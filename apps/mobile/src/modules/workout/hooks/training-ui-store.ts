import { create } from "zustand";
import type { TrainingAnswer } from "../services/training-ai";

type TrainingUi = {
	answer: (TrainingAnswer & { question: string }) | null;
	setAnswer: (answer: (TrainingAnswer & { question: string }) | null) => void;
};

/** Training's screen state that outlives one screen. */
export const useTrainingUi = create<TrainingUi>((set) => ({
	answer: null,
	setAnswer: (answer) => set({ answer }),
}));

export const TRAINING_ASK_JOB = "training:ask";
export const TRAINING_SKILL_JOB = "training:skill";
