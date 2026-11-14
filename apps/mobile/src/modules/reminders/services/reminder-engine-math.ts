/** When a scheduled trigger fires next, from the shape the phone reports it in. */
export function nextFire(scheduled: unknown, now: Date): Date | null {
	if (!scheduled || typeof scheduled !== "object") return null;
	const value = scheduled as Record<string, unknown>;
	const number = (key: string) => (typeof value[key] === "number" ? (value[key] as number) : null);
	if (value.type === "date") {
		const at = number("value") ?? number("timestamp");
		return at === null ? null : new Date(at);
	}
	const hour = number("hour");
	const minute = number("minute");
	if (hour === null || minute === null) return null;
	const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
	if (value.type === "daily") {
		if (next <= now) next.setDate(next.getDate() + 1);
		return next;
	}
	const weekday = number("weekday");
	if (value.type === "weekly" && weekday !== null) {
		const ahead = (weekday - 1 - now.getDay() + 7) % 7;
		next.setDate(next.getDate() + ahead);
		if (next <= now) next.setDate(next.getDate() + 7);
		return next;
	}
	return null;
}
