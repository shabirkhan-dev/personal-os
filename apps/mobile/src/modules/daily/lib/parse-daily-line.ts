/**
 * Reads a line from Daily's ask bar: sleep ("slept 23:40 to 06:20"), its own minimum items
 * ("read 10 pages", "phone off"), "what's next", or a screen. Anything else goes to the module it
 * names, through the same routing Talk to OS uses.
 */

export type DailyScreen = "plan" | "close" | "brief" | "sleep" | "minimum" | "insights";

export type DailyIntent =
	| { kind: "sleep"; bed: number; wake: number }
	| { kind: "tick"; id: "read" | "phone" }
	| { kind: "next" }
	| { kind: "open"; screen: DailyScreen }
	| { kind: "other"; text: string };

const SCREENS: readonly [RegExp, DailyScreen][] = [
	[/\bplan (my |the )?day\b|\bplan\b/, "plan"],
	[/\bclose (my |the )?day\b|\bend of day\b/, "close"],
	[/\b(morning )?brief\b|\bgood morning\b/, "brief"],
	[/\bminimum day\b/, "minimum"],
	[/\b(insights?|recap)\b/, "insights"],
	[/\bsleep\b/, "sleep"],
];

/** "23:40", "11:40 pm", "6", "6:20am" → minutes after midnight. */
export function readClock(text: string, evening: boolean): number | null {
	const match = /^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/.exec(text.trim());
	if (!match) return null;
	let hour = Number(match[1]);
	const minute = Number(match[2] ?? 0);
	if (hour > 23 || minute > 59) return null;
	if (match[3] === "pm" && hour < 12) hour += 12;
	if (match[3] === "am" && hour === 12) hour = 0;
	if (!match[3] && evening && hour >= 7 && hour < 12) hour += 12;
	return hour * 60 + minute;
}

const TIME = String.raw`(\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm)?)`;

export function parseDailyLine(input: string, wakeAt: number): DailyIntent | null {
	const text = input.trim().toLowerCase();
	if (!text) return null;

	const range = new RegExp(
		String.raw`\b(?:slept|sleep|bed|in bed)\b.*?${TIME}\s*(?:to|-|–|until|till|and woke(?: up)?(?: at)?|,\s*woke(?: up)?(?: at)?)\s*${TIME}`,
	).exec(text);
	if (range?.[1] && range[2]) {
		const bed = readClock(range[1], true);
		const wake = readClock(range[2], false);
		if (bed !== null && wake !== null) return { kind: "sleep", bed, wake };
	}
	const hours = /\bslept\s+(\d{1,2}(?:\.\d)?)\s*(?:h|hours?)\b(?:\s*(\d{1,2})\s*m)?/.exec(text);
	if (hours?.[1]) {
		const minutes = Math.round(Number(hours[1]) * 60 + Number(hours[2] ?? 0));
		return { kind: "sleep", bed: (wakeAt - minutes + 1440) % 1440, wake: wakeAt };
	}
	if (/\bread\b.*\b(pages?|book|chapter)\b|\b(pages?)\b.*\bread\b|^read\b/.test(text))
		return { kind: "tick", id: "read" };
	if (/\b(no phone|phone (off|away|on the charger|down))\b/.test(text))
		return { kind: "tick", id: "phone" };
	if (/\bwhat'?s next\b|\bwhat now\b|\bnext\??$/.test(text)) return { kind: "next" };
	for (const [pattern, screen] of SCREENS) {
		if (pattern.test(text) && text.split(/\s+/).length <= 5) return { kind: "open", screen };
	}
	return { kind: "other", text: input.trim() };
}
