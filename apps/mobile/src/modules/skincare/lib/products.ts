import type { Product } from "./skincare-types";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Below this share left a product is low: caution colour and the Reorder button. */
export const LOW_SHARE = 0.25;

export type ProductUsage = {
	/** 0–100, how much of the bottle is left, estimated from time since it was opened. */
	leftPercent: number;
	daysLeft: number;
	low: boolean;
	/** "About 2 weeks left", "Running out", "Probably empty". */
	leftLabel: string;
};

function parseDay(key: string): Date {
	const [y, m, d] = key.split("-").map(Number);
	return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function midnight(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole days from `from` (a day key) to `now`, counted on calendar days. */
export function daysSince(from: string, now: Date): number {
	return Math.max(0, Math.round((midnight(now).getTime() - parseDay(from).getTime()) / DAY_MS));
}

export function leftLabel(daysLeft: number): string {
	if (daysLeft <= 0) return "Probably empty";
	if (daysLeft < 7) return daysLeft === 1 ? "About 1 day left" : `About ${daysLeft} days left`;
	const weeks = Math.round(daysLeft / 7);
	if (weeks <= 8) return weeks === 1 ? "About 1 week left" : `About ${weeks} weeks left`;
	return `About ${Math.round(daysLeft / 30)} months left`;
}

export function productUsage(product: Product, now: Date): ProductUsage {
	const totalDays = Math.max(1, Math.round(product.lastsWeeks * 7));
	const daysLeft = Math.max(0, totalDays - daysSince(product.startedAt, now));
	const share = daysLeft / totalDays;
	return {
		leftPercent: Math.round(share * 100),
		daysLeft,
		low: share < LOW_SHARE,
		leftLabel: leftLabel(daysLeft),
	};
}
