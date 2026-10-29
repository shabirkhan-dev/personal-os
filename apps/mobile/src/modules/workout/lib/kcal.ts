import { dayKey } from "@/lib/day";
import type { Session } from "./training-model";

export { estimateKcal } from "@personal-os/domain/training";

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
