import { dayKey } from "@/lib/day";
import type { EnergyCheckin } from "./types";

export type EnergyCandle = { hour: number; low: number; high: number };

export type EnergyDay = {
	/** One entry per hour with check-ins, in order. */
	candles: EnergyCandle[];
	latest: EnergyCheckin | null;
	low: number | null;
	peak: number | null;
	lowHour: number | null;
	peakHour: number | null;
};

/** Today's energy check-ins summarised by hour for the Day Range widget. */
export function energyDay(checkins: readonly EnergyCheckin[], now: Date): EnergyDay {
	const today = dayKey(now);
	const list = checkins
		.filter((item) => dayKey(new Date(item.at)) === today)
		.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
	const byHour = new Map<number, EnergyCandle>();
	let low: EnergyCheckin | null = null;
	let peak: EnergyCheckin | null = null;
	for (const item of list) {
		const hour = new Date(item.at).getHours();
		const candle = byHour.get(hour);
		if (candle) {
			candle.low = Math.min(candle.low, item.level);
			candle.high = Math.max(candle.high, item.level);
		} else {
			byHour.set(hour, { hour, low: item.level, high: item.level });
		}
		if (!low || item.level < low.level) low = item;
		if (!peak || item.level > peak.level) peak = item;
	}
	const candles = [...byHour.values()].sort((a, b) => a.hour - b.hour);
	return {
		candles,
		latest: list.length > 0 ? (list[list.length - 1] ?? null) : null,
		low: low ? low.level : null,
		peak: peak ? peak.level : null,
		lowHour: low ? new Date(low.at).getHours() : null,
		peakHour: peak ? new Date(peak.at).getHours() : null,
	};
}

export function clampLevel(value: number): number {
	return Math.max(0, Math.min(100, Math.round(value)));
}
