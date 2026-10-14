import { clampLevel } from "./energy";
import { typeLabel, type WorkoutType } from "./types";

export type ParsedLog =
	| {
			kind: "session";
			type: WorkoutType;
			title: string;
			/** Null when the text gave a distance but no time: the sheet asks for it. */
			durationMin: number | null;
			distanceKm?: number;
	  }
	| { kind: "energy"; level: number };

const TYPE_WORDS: readonly [RegExp, WorkoutType][] = [
	[/\b(ran|run|running|jog\w*)\b/, "run"],
	[/\b(walk\w*|hike\w*|hiking)\b/, "walk"],
	[/\b(cycl\w*|bike\w*|biking|rode|ride|riding|spin)\b/, "cycle"],
	[/\b(yoga|stretch\w*|pilates|mobility)\b/, "yoga"],
	[
		/\b(gym|lift\w*|weights?|strength|push|pull|legs?|chest|back|arms?|squats?|deadlifts?)\b/,
		"strength",
	],
];

function parseEnergy(text: string): number | null {
	const match =
		/\benergy\b\D{0,6}(\d{1,3})\b/.exec(text) ?? /\b(\d{1,3})\s*%?\s*energy\b/.exec(text);
	if (!match?.[1]) return null;
	const value = Number(match[1]);
	return value >= 0 && value <= 100 ? clampLevel(value) : null;
}

function parseDistance(text: string): number | null {
	const km = /(\d+(?:[.,]\d+)?)\s*(?:k|km|kms|kilomet\w*)\b/.exec(text);
	if (km?.[1]) return Number(km[1].replace(",", "."));
	const miles = /(\d+(?:[.,]\d+)?)\s*(?:mi|miles?)\b/.exec(text);
	if (miles?.[1]) return Math.round(Number(miles[1].replace(",", ".")) * 1.609 * 100) / 100;
	return null;
}

function parseMinutes(text: string): number | null {
	const hours = /(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hours?)\b/.exec(text);
	const mins = /(\d+)\s*(?:m|min|mins|minutes?)\b/.exec(text);
	let total = 0;
	if (hours?.[1]) total += Number(hours[1].replace(",", ".")) * 60;
	if (mins?.[1]) total += Number(mins[1]);
	return total > 0 ? Math.round(total) : null;
}

function parseType(text: string): WorkoutType | null {
	for (const [pattern, type] of TYPE_WORDS) if (pattern.test(text)) return type;
	return null;
}

/**
 * Reads quick logs typed into the ask bar: "ran 5k in 30 min", "45 min gym", "walked 20 minutes"
 * become a session, "energy 70" a check-in. Anything else returns null.
 */
export function parseWorkoutText(input: string): ParsedLog | null {
	const text = input.trim().toLowerCase();
	if (!text) return null;
	const level = parseEnergy(text);
	if (level !== null) return { kind: "energy", level };

	const distance = parseDistance(text);
	const minutes = parseMinutes(text);
	const type = parseType(text) ?? (distance !== null ? "run" : minutes !== null ? "other" : null);
	if (type === null) return null;
	if (distance === null && minutes === null) return null;

	const title =
		distance !== null ? `${typeLabel[type]} · ${formatKm(distance)} km` : typeLabel[type];
	return {
		kind: "session",
		type,
		title,
		durationMin: minutes,
		...(distance !== null && distance > 0 ? { distanceKm: distance } : {}),
	};
}

/** "5", "5.3", "21.1". */
export function formatKm(km: number): string {
	return Number.isInteger(km) ? String(km) : km.toFixed(km < 10 ? 2 : 1).replace(/0+$/, "");
}
