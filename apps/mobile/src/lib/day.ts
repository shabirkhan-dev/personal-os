/** Local calendar days as "YYYY-MM-DD" keys, for logs grouped by day. */

export { addDays, dayKey, monthKey, newId } from "@personal-os/domain/dates";

const pad = (n: number) => String(n).padStart(2, "0");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthShort(date: Date = new Date()): string {
	return MONTHS[date.getMonth()] ?? "";
}

/** "HH:MM" in 24-hour time. */
export function clock(date: Date): string {
	return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
