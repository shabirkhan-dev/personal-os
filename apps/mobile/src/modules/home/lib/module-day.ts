/**
 * What a module tells Daily life about today: timed things for the plan and "rest of today", and
 * the numbers the minimum day reads. Each module fills it from its own data; Daily never reads
 * another module's storage directly.
 */
export type DayEntry = {
	id: string;
	/** Minutes after midnight. */
	minutes: number;
	/** How long it takes, in minutes. */
	length: number;
	title: string;
	/** "10 min", "620 kcal". */
	detail: string;
	done: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function minutesOf(date: Date): number {
	return date.getHours() * 60 + date.getMinutes();
}

export function clockOf(minutes: number): string {
	const wrapped = ((Math.round(minutes) % 1440) + 1440) % 1440;
	return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
}
