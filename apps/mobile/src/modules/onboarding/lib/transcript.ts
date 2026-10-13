import type { Birthday } from "./insights";
import type { GoalId, WorkStyle } from "./options";

/** A transcript span; `fact` spans are what the assistant understood. */
export type TranscriptSpan = { text: string; fact?: boolean };

/**
 * Mock "Just talk" transcript (frame 07). Real speech-to-text is out of scope for
 * onboarding v5; the spans reveal word by word to simulate live listening.
 */
export const mockTranscript: readonly TranscriptSpan[] = [
	{ text: "I'm " },
	{ text: "Shabir, 28", fact: true },
	{ text: ". I'm " },
	{ text: "175", fact: true },
	{ text: " and about " },
	{ text: "72 kilos", fact: true },
	{ text: ". I wake up at " },
	{ text: "6:30", fact: true },
	{ text: " and sleep around " },
	{ text: "11", fact: true },
	{ text: ". I work " },
	{ text: "hybrid, 9 to 6", fact: true },
	{ text: ". I want to " },
	{ text: "lose weight", fact: true },
	{ text: " and " },
	{ text: "save money…", fact: true },
];

/** Answers the mock transcript fills in. Gender is intentionally missing ("7 of 8"). */
export type TranscriptAnswers = {
	name: string;
	birthday: Birthday;
	heightCm: number;
	weightKg: number;
	wakeMinutes: number;
	bedMinutes: number;
	workStartMinutes: number;
	workEndMinutes: number;
	workStyle: WorkStyle;
	goals: GoalId[];
};

export function transcriptAnswers(today: Date): TranscriptAnswers {
	return {
		name: "Shabir",
		// "28" with no date: assume the birthday has passed this year.
		birthday: { day: 1, month: 1, year: today.getFullYear() - 28 },
		heightCm: 175,
		weightKg: 72,
		wakeMinutes: 6 * 60 + 30,
		bedMinutes: 23 * 60,
		workStartMinutes: 9 * 60,
		workEndMinutes: 18 * 60,
		workStyle: "hybrid",
		goals: ["lose-weight", "save-money"],
	};
}

export type FactChip = { id: string; label: string; value: string; known: boolean };

/** The fact chips shown under the transcript once it has been understood. */
export const transcriptFacts: readonly FactChip[] = [
	{ id: "name", label: "Name", value: "Shabir", known: true },
	{ id: "age", label: "Age", value: "28 years", known: true },
	{ id: "body", label: "Body", value: "175 cm · 72 kg", known: true },
	{ id: "day", label: "Day", value: "06:30 → 23:00", known: true },
	{ id: "work", label: "Work", value: "Hybrid 9–6", known: true },
	{ id: "goal-1", label: "Goal", value: "Lose weight", known: true },
	{ id: "goal-2", label: "Goal", value: "Save money", known: true },
	{ id: "gender", label: "Tap to add", value: "Gender", known: false },
];
