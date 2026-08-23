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
