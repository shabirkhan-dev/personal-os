/** Pure schedule helpers for routines: weekday matching and daysOfWeek storage. */

/** Pure schedule matcher: does this routine run on the given ISO weekday? */
export function isScheduledOn(
	scheduleType: string,
	daysOfWeek: string | null,
	weekday: number,
): boolean {
	if (scheduleType === 'daily') return true;
	if (!daysOfWeek) return false;
	return parseDaysOfWeek(daysOfWeek).includes(weekday);
}

/** Canonical storage form for daysOfWeek, e.g. [5, 1] -> "1,5". */
export function normalizeDaysOfWeek(daysOfWeek: number[]): string {
	return [...new Set(daysOfWeek)].sort((a, b) => a - b).join(',');
}

/** Parses the stored daysOfWeek form back into ISO weekday numbers. */
export function parseDaysOfWeek(daysOfWeek: string | null): number[] {
	if (!daysOfWeek) return [];
	return daysOfWeek
		.split(',')
		.map((token) => Number.parseInt(token.trim(), 10))
		.filter((value) => Number.isInteger(value));
}
