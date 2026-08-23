export const DEFAULT_TIME_ZONE = 'UTC';

/** Returns the calendar date (YYYY-MM-DD) in the given IANA time zone. */
export function localDateInTimeZone(date: Date, timeZone: string): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
}

/** Returns the ISO weekday number (1 = Monday .. 7 = Sunday) in the given time zone. */
export function isoWeekdayInTimeZone(date: Date, timeZone: string): number {
	const shortWeekday = new Intl.DateTimeFormat('en-US', {
		timeZone,
		weekday: 'short',
	}).format(date);
	const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const index = order.indexOf(shortWeekday);
	if (index < 0) throw new Error(`Unexpected weekday token: ${shortWeekday}`);
	return index + 1;
}

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
