const MINUTES_PER_DAY = 24 * 60;

/** Wraps a minute-of-day value into 0..1439. */
export function wrapMinutes(minutes: number): number {
	return ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/** Formats minutes since midnight as "HH:MM". */
export function formatClock(minutes: number): string {
	const value = wrapMinutes(minutes);
	const hours = Math.floor(value / 60);
	const mins = value % 60;
	return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/** Formats a duration in minutes as "7h 30m" (or "8h" when there are no minutes). */
export function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

/** Minutes asleep from bedtime to wake time, crossing midnight when needed. */
export function sleepMinutes(bedtime: number, wake: number): number {
	return wrapMinutes(wake - bedtime);
}
