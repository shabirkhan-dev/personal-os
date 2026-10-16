import { dayKey } from "@/lib/day";
import type { Session, Sport } from "./training-model";

/** Compendium-style MET values for a typical effort. */
const MET: Record<Sport, number> = {
	calisthenics: 5,
	running: 9.8,
	boxing: 7.8,
	yoga: 2.5,
	football: 7,
	volleyball: 4,
	gym: 5,
	swimming: 7,
	walk: 3.5,
	cycle: 7.5,
	other: 4.5,
};

/** Running MET from pace: roughly 1 MET per km/h, kept within a sane range. */
function runMet(distanceKm: number, durationMin: number): number {
	const kmh = distanceKm / (durationMin / 60);
	return Math.min(16, Math.max(6, kmh));
}

/** kcal = MET × weight (kg) × hours, rounded. */
export function estimateKcal(
	type: Sport,
	durationMin: number,
	weightKg: number,
	distanceKm?: number,
): number {
	if (durationMin <= 0 || weightKg <= 0) return 0;
	const met =
		type === "running" && distanceKm && distanceKm > 0
			? runMet(distanceKm, durationMin)
			: MET[type];
	return Math.round(met * weightKg * (durationMin / 60));
}

/** Sessions that started on the same local day as `day`. */
export function sessionsOn(sessions: readonly Session[], day: Date): Session[] {
	const key = dayKey(day);
	return sessions.filter((session) => dayKey(new Date(session.startedAt)) === key);
}

export function kcalOn(sessions: readonly Session[], day: Date): number {
	return sessionsOn(sessions, day).reduce((sum, session) => sum + session.kcal, 0);
}

/** "1,240" without relying on Intl. */
export function formatThousands(value: number): string {
	return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
