/** A unique enough id for a record; the phone and the API make them alike. */
export function newId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** `date` moved by whole days, keeping the time of day. */
export function addDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
}
