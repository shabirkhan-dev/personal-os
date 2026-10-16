import { asArray, asNumber, asString, isRecord } from "@/lib/storage/parse";

/** Today's UV from Open-Meteo, and the line the Home shows about it. */

export type UvDay = {
	day: string;
	max: number;
	place: string;
	elevation: number;
	fetchedAt: string;
};

export function parseUv(raw: unknown, place: string, now: Date): UvDay | null {
	if (!isRecord(raw) || !isRecord(raw.daily)) return null;
	const days = asArray(raw.daily.time, (value) => (typeof value === "string" ? value : null));
	const maxes = asArray(raw.daily.uv_index_max, (value) =>
		typeof value === "number" ? value : null,
	);
	const day = days[0];
	const max = maxes[0];
	if (!day || max === undefined) return null;
	return {
		day,
		max: Math.round(max),
		place,
		elevation: Math.round(asNumber(raw.elevation, 0)),
		fetchedAt: now.toISOString(),
	};
}

export function parseCachedUv(raw: unknown): UvDay | null {
	if (!isRecord(raw)) return null;
	const day = asString(raw.day, "");
	const max = asNumber(raw.max, -1);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || max < 0) return null;
	return {
		day,
		max,
		place: asString(raw.place, ""),
		elevation: asNumber(raw.elevation, 0),
		fetchedAt: asString(raw.fetchedAt, ""),
	};
}

/** "UV 8 at Gilgit's altitude. Reapply sunscreen at 13:00 if you're out." Null when UV is low. */
export function uvLine(uv: UvDay | null, reapply: string): string | null {
	if (!uv || uv.max < 3) return null;
	const where = uv.place
		? uv.elevation >= 1200
			? ` at ${uv.place}'s altitude`
			: ` in ${uv.place}`
		: "";
	const advice =
		uv.max >= 6 ? `Reapply sunscreen at ${reapply} if you're out.` : "Sunscreen before you go out.";
	return `UV ${uv.max}${where}. ${advice}`;
}
