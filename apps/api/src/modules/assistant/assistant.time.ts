/**
 * The person's clock. The API runs in UTC; the assistant talks in the person's own time zone, so
 * "Monday at 3" means 3 pm where they are.
 */

const pad = (value: number) => String(value).padStart(2, "0");

/** A valid IANA zone, or UTC. */
export function safeZone(timeZone: string): string {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone }).format(0);
		return timeZone;
	} catch {
		return "UTC";
	}
}

function partsIn(date: Date, timeZone: string) {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
		weekday: "short",
	}).formatToParts(date);
	const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
	return {
		year: Number(get("year")),
		month: Number(get("month")),
		day: Number(get("day")),
		hour: Number(get("hour")),
		minute: Number(get("minute")),
		weekday: get("weekday"),
	};
}

/** "2026-10-30" in the person's zone. */
export function localDate(date: Date, timeZone: string): string {
	const p = partsIn(date, timeZone);
	return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** "Fri 30 Oct 2026, 14:05", for the prompt and cards. */
export function localLabel(date: Date, timeZone: string): string {
	const p = partsIn(date, timeZone);
	const month = new Intl.DateTimeFormat("en-US", { timeZone, month: "short" }).format(date);
	return `${p.weekday} ${p.day} ${month} ${p.year}, ${pad(p.hour)}:${pad(p.minute)}`;
}

/** "2026-11-02T15:00" (or "2026-11-02", read as 09:00) in the person's zone, as a UTC Date. */
export function zonedToDate(local: string, timeZone: string): Date | null {
	const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/.exec(local.trim());
	if (!match) return null;
	const [, y, mo, d, h = "09", mi = "00"] = match;
	const wall = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
	// The zone's offset at that moment, measured once and corrected once for a DST edge.
	let guess = wall;
	for (let i = 0; i < 2; i += 1) {
		const p = partsIn(new Date(guess), timeZone);
		const seen = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
		guess += wall - seen;
	}
	const result = new Date(guess);
	return Number.isNaN(result.getTime()) ? null : result;
}
