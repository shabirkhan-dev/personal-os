/** Short texts that fit a home-screen widget. */

/** "in 1 h 20 min", "in 5 min". */
export function untilText(at: Date, now: Date): string {
	const minutes = Math.max(0, Math.round((at.getTime() - now.getTime()) / 60_000));
	if (minutes < 60) return `in ${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return rest ? `in ${hours} h ${rest} min` : `in ${hours} h`;
}

/** "Rs 12.5k" for a small widget. */
export function shortMoney(amount: number): string {
	const sign = amount < 0 ? "−" : "";
	const value = Math.abs(amount);
	if (value >= 100_000) return `${sign}Rs ${(value / 1000).toFixed(0)}k`;
	if (value >= 10_000) return `${sign}Rs ${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
	return `${sign}Rs ${value.toLocaleString("en-US")}`;
}

export function clockText(date: Date): string {
	return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
