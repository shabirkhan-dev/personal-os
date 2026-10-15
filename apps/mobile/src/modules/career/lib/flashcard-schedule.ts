import type { Flashcard } from "./career-model";

export const RATINGS = ["again", "hard", "good", "easy"] as const;
export type Rating = (typeof RATINGS)[number];

const MINUTE = 60_000;
const DAY_MINUTES = 24 * 60;

/**
 * Next spacing in minutes. A small, predictable scheme: new cards go 1m / 6m / 1d / 4d; after
 * that "good" doubles the gap and "easy" quadruples it; "again" starts the card over.
 */
export function nextInterval(
	card: Pick<Flashcard, "intervalMinutes" | "reps">,
	rating: Rating,
): number {
	if (rating === "again") return 1;
	if (card.reps === 0 || card.intervalMinutes < DAY_MINUTES) {
		return { hard: 6, good: DAY_MINUTES, easy: 4 * DAY_MINUTES }[rating];
	}
	const factor = { hard: 1.2, good: 2, easy: 4 }[rating];
	return Math.round(card.intervalMinutes * factor);
}

export function review(card: Flashcard, rating: Rating, now: Date): Flashcard {
	const interval = nextInterval(card, rating);
	return {
		...card,
		intervalMinutes: interval,
		reps: rating === "again" ? 0 : card.reps + 1,
		dueAt: new Date(now.getTime() + interval * MINUTE).toISOString(),
	};
}

/** "1m", "6m", "1d", "4d", "3w". */
export function formatInterval(minutes: number): string {
	if (minutes < 60) return `${minutes}m`;
	if (minutes < DAY_MINUTES) return `${Math.round(minutes / 60)}h`;
	const days = Math.round(minutes / DAY_MINUTES);
	return days < 14 ? `${days}d` : `${Math.round(days / 7)}w`;
}

/** Cards due now, oldest due first. */
export function dueCards(cards: readonly Flashcard[], now: Date): Flashcard[] {
	return cards
		.filter((card) => Date.parse(card.dueAt) <= now.getTime())
		.sort((a, b) => Date.parse(a.dueAt) - Date.parse(b.dueAt));
}

/** Cards that will be due before `deadline` (e.g. the interview), counting those due now. */
export function dueBefore(cards: readonly Flashcard[], deadline: Date): number {
	return cards.filter((card) => Date.parse(card.dueAt) <= deadline.getTime()).length;
}
