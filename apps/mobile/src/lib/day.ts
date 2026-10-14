/** Local calendar days as "YYYY-MM-DD" keys, for logs grouped by day. */

const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(date: Date = new Date()): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM" for monthly totals. */
export function monthKey(date: Date = new Date()): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function addDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
}

/** A unique enough id for on-device records. */
export function newId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthShort(date: Date = new Date()): string {
	return MONTHS[date.getMonth()] ?? "";
}

/** "HH:MM" in 24-hour time. */
export function clock(date: Date): string {
	return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
