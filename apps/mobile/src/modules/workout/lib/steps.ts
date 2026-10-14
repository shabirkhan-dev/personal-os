import { addDays } from "@/lib/day";

const FALLBACK_STRIDE_M = 0.75;

/** Walking stride ≈ 41.5% of height. */
export function strideMeters(heightCm: number): number {
	return heightCm >= 100 && heightCm <= 250 ? (heightCm * 0.415) / 100 : FALLBACK_STRIDE_M;
}

export function stepsToKm(steps: number, heightCm: number): number {
	return (steps * strideMeters(heightCm)) / 1000;
}

/** Midnight of each of the last `count` days, oldest first, ending today. */
export function lastDays(now: Date, count: number): Date[] {
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const out: Date[] = [];
	for (let back = count - 1; back >= 0; back -= 1) out.push(addDays(today, -back));
	return out;
}

/** Bar heights scaled to the busiest day; empty days keep a small stub. */
export function barHeights(values: readonly number[], max: number, min: number): number[] {
	const top = values.reduce((best, value) => Math.max(best, value), 0);
	return values.map((value) => (top > 0 ? Math.max(min, Math.round((value / top) * max)) : min));
}
