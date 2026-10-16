import { templateById } from "./library";
import type { Sport } from "./training-model";

/**
 * Reads a line from Training's ask bar: "ran 5 km in 28 min", "boxing 6 rounds", "did push day",
 * "45 min yoga", "12 pull-ups", a screen to open, or "start". Anything else is a question for the
 * Training AI.
 */

export type TrainingScreen = "week" | "skills" | "insights" | "timer";

export type LoggedLine = {
	sport: Sport;
	template: string | null;
	title: string;
	durationMin: number;
	distanceKm: number | null;
	rounds: number | null;
	sets: { exercise: string; value: number; unit: "reps" | "s" }[];
};

export type TrainingIntent =
	| { kind: "log"; session: LoggedLine }
	| { kind: "start" }
	| { kind: "open"; screen: TrainingScreen }
	| { kind: "question"; text: string };

const SPORT_WORDS: readonly [RegExp, Sport, string | null][] = [
	[/\b(ran|run|running|jog(ged)?)\b/, "running", "easy-run"],
	[/\b(box(ed|ing)?|shadow ?box(ing)?|sparr(ed|ing))\b/, "boxing", "shadow-boxing"],
	[/\b(yoga|mobility|stretch(ed|ing)?)\b/, "yoga", "mobility"],
	[/\b(football|soccer)\b/, "football", "football"],
	[/\b(volleyball)\b/, "volleyball", "volleyball"],
	[/\b(walk(ed)?|steps)\b/, "walk", null],
	[/\b(cycl(ed|ing)|ride|rode|bike)\b/, "cycle", null],
	[/\b(swim(ming)?|swam)\b/, "swimming", null],
	[/\b(gym|weights|lift(ed|ing)?)\b/, "gym", null],
	[
		/\b(push day|push|handstand|pull day|pull|legs|calisthenics|pull-?ups?|push-?ups?|dips|pistols?|workout|trained)\b/,
		"calisthenics",
		null,
	],
];

const EXERCISES: readonly [RegExp, string][] = [
	[/(\d+)\s*(?:strict\s*)?pull-?ups?\b/, "Pull-ups"],
	[/(\d+)\s*push-?ups?\b/, "Push-ups"],
	[/(\d+)\s*dips\b/, "Dips"],
	[/(\d+)\s*pistols?\b/, "Pistol squat"],
];

function templateFor(text: string, sport: Sport, fallback: string | null): string | null {
	if (sport === "calisthenics") {
		if (/\b(push|handstand)\b/.test(text)) return "push-handstand";
		if (/\b(pull)\b/.test(text)) return "pull-core";
		if (/\b(legs?|pistol)\b/.test(text)) return "legs-core";
		return null;
	}
	if (sport === "running" && /\blong\b/.test(text)) return "long-run";
	return fallback;
}

export function parseTrainingLine(input: string): TrainingIntent | null {
	const text = input.trim().toLowerCase();
	if (!text) return null;
	if (/\?$|^(what|which|how|should|can|is|does|do|why|tell me|suggest)\b/.test(text)) {
		return { kind: "question", text: input.trim() };
	}
	if (/^(start|go|let'?s go|begin)\b/.test(text)) return { kind: "start" };
	if (/\b(this week|week plan|program)\b/.test(text) && text.split(/\s+/).length <= 4)
		return { kind: "open", screen: "week" };
	if (/\bskills?\b/.test(text) && text.split(/\s+/).length <= 3)
		return { kind: "open", screen: "skills" };
	if (/\b(insights?|recap)\b/.test(text)) return { kind: "open", screen: "insights" };
	if (/^timer\b/.test(text)) return { kind: "open", screen: "timer" };

	const match = SPORT_WORDS.find(([pattern]) => pattern.test(text));
	if (!match) return { kind: "question", text: input.trim() };
	const [, sport, fallback] = match;
	const template = templateFor(text, sport, fallback);
	const km = /(\d+(?:\.\d+)?)\s*(km|k)\b/.exec(text);
	const hours = /(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?)\b/.exec(text);
	const minutes = /(\d+)\s*(m|min|mins|minutes)\b/.exec(text);
	const clock = /\bin\s+(\d{1,2}):(\d{2})\b/.exec(text);
	const rounds = /(\d+)\s*rounds?\b/.exec(text);
	const sets = EXERCISES.flatMap(([pattern, exercise]) => {
		const found = pattern.exec(text);
		return found?.[1] ? [{ exercise, value: Number(found[1]), unit: "reps" as const }] : [];
	});
	const known = templateById(template);
	let durationMin = clock?.[1]
		? Number(clock[1]) + Number(clock[2]) / 60
		: (hours?.[1] ? Number(hours[1]) * 60 : 0) + (minutes?.[1] ? Number(minutes[1]) : 0);
	if (!durationMin && rounds?.[1]) durationMin = Number(rounds[1]) * 4;
	if (!durationMin) durationMin = known?.minutes ?? 30;
	return {
		kind: "log",
		session: {
			sport,
			template,
			title:
				known?.title ??
				(sport === "calisthenics"
					? "Bodyweight session"
					: sport.charAt(0).toUpperCase() + sport.slice(1)),
			durationMin: Math.round(durationMin),
			distanceKm: km?.[1] ? Number(km[1]) : null,
			rounds: rounds?.[1] ? Number(rounds[1]) : null,
			sets,
		},
	};
}
