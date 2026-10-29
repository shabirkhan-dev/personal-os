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

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" of `date`'s local calendar day. */
export function dayKey(date: Date = new Date()): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM" of `date`'s local month. */
export function monthKey(date: Date = new Date()): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
