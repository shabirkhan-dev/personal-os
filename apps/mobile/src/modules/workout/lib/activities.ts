import { asArray, asNumber, asString, isRecord, oneOf } from "@/lib/storage/parse";
import type { Exercise, Template } from "./library";
import { SPORT_LABELS, SPORTS, type Sport } from "./training-model";

/**
 * Activities are whatever someone does, defined by them: football, swimming, climbing, a boxing
 * club. Each has a category (for calories and colour), a usual length, whether it has a distance,
 * and its own numbers to track ("Goals", "Laps", "Points"). Presets are only a starting point.
 */

export type ActivityMetric = { key: string; label: string; unit: string };

export type Activity = {
	id: string;
	name: string;
	kind: Sport;
	minutes: number;
	distance: boolean;
	metrics: ActivityMetric[];
	/** Training photo key shown for it. */
	photo: string;
	createdAt: string;
};

export type ActivityPreset = Omit<Activity, "id" | "createdAt">;

const metric = (label: string, unit = ""): ActivityMetric => ({
	key: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
	label,
	unit,
});

export const ACTIVITY_PRESETS: readonly ActivityPreset[] = [
	{
		name: "Football",
		kind: "football",
		minutes: 75,
		distance: false,
		metrics: [metric("Goals"), metric("Assists")],
		photo: "football",
	},
	{
		name: "Volleyball",
		kind: "volleyball",
		minutes: 75,
		distance: false,
		metrics: [metric("Points"), metric("Aces")],
		photo: "volleyball",
	},
	{
		name: "Running",
		kind: "running",
		minutes: 30,
		distance: true,
		metrics: [],
		photo: "mountain-run",
	},
	{
		name: "Swimming",
		kind: "swimming",
		minutes: 45,
		distance: true,
		metrics: [metric("Laps")],
		photo: "yoga",
	},
	{
		name: "Cycling",
		kind: "cycle",
		minutes: 60,
		distance: true,
		metrics: [metric("Climb", "m")],
		photo: "mountain-run",
	},
	{
		name: "Walk",
		kind: "walk",
		minutes: 40,
		distance: true,
		metrics: [metric("Steps")],
		photo: "mountain-run",
	},
	{
		name: "Boxing club",
		kind: "boxing",
		minutes: 60,
		distance: false,
		metrics: [metric("Rounds")],
		photo: "shadow-boxing",
	},
	{
		name: "Basketball",
		kind: "other",
		minutes: 60,
		distance: false,
		metrics: [metric("Points")],
		photo: "volleyball",
	},
	{
		name: "Cricket",
		kind: "other",
		minutes: 120,
		distance: false,
		metrics: [metric("Runs"), metric("Wickets")],
		photo: "football",
	},
	{
		name: "Tennis",
		kind: "other",
		minutes: 60,
		distance: false,
		metrics: [metric("Sets won")],
		photo: "volleyball",
	},
	{
		name: "Climbing",
		kind: "other",
		minutes: 90,
		distance: false,
		metrics: [metric("Routes"), metric("Hardest grade")],
		photo: "pull-ups",
	},
	{ name: "Yoga class", kind: "yoga", minutes: 60, distance: false, metrics: [], photo: "yoga" },
	{ name: "Gym", kind: "gym", minutes: 60, distance: false, metrics: [], photo: "dips-hero" },
];

/** The preset for a category, used for team days saved before activities existed. */
export function presetForKind(kind: Sport): ActivityPreset {
	return (
		ACTIVITY_PRESETS.find((preset) => preset.kind === kind) ?? {
			name: SPORT_LABELS[kind],
			kind,
			minutes: 60,
			distance: false,
			metrics: [],
			photo: "handstand",
		}
	);
}

/** "a:<activity id>": an activity on the week plan. Old team days use "a:sport:football". */
export function activityTemplateId(activityId: string): string {
	return `a:${activityId}`;
}

/** The activity an "a:" id points at: one of theirs, or the preset for an old team day. */
export function activityFor(
	id: string,
	activities: readonly Activity[],
): Activity | ActivityPreset | null {
	if (!id.startsWith("a:")) return null;
	const activityId = id.slice(2);
	const own = activities.find((activity) => activity.id === activityId);
	if (own) return own;
	const legacy = /^sport:(.+)$/.exec(activityId)?.[1];
	return legacy && (SPORTS as readonly string[]).includes(legacy)
		? presetForKind(legacy as Sport)
		: null;
}

/** An activity as a session the week, Home and the calendar can show. */
export function activityTemplate(id: string, activity: Activity | ActivityPreset): Template {
	const block: Exercise = {
		name: activity.name,
		photo: activity.photo,
		sets: 1,
		target: activity.minutes,
		unit: "min",
		restS: 0,
		note:
			activity.metrics.length > 0
				? `Track ${activity.metrics.map((m) => m.label.toLowerCase()).join(", ")}`
				: "Log how it went",
	};
	return {
		id,
		title: activity.name,
		sport: activity.kind,
		photo: activity.photo,
		hero: activity.photo,
		minutes: activity.minutes,
		effort: 6,
		exercises: [block],
		short: `${activity.minutes} min`,
	};
}

export function parseActivity(raw: unknown): Activity | null {
	if (!isRecord(raw)) return null;
	const id = asString(raw.id, "");
	const name = asString(raw.name, "").trim().slice(0, 40);
	if (!id || !name) return null;
	const seen = new Set<string>();
	const metrics = asArray(raw.metrics, (item): ActivityMetric | null => {
		if (!isRecord(item)) return null;
		const label = asString(item.label, "").trim().slice(0, 24);
		if (!label) return null;
		const key = asString(item.key, "") || metric(label).key;
		if (seen.has(key)) return null;
		seen.add(key);
		return { key, label, unit: asString(item.unit, "").trim().slice(0, 8) };
	}).slice(0, 6);
	return {
		id,
		name,
		kind: oneOf(raw.kind, SPORTS, "other"),
		minutes: Math.min(600, Math.max(5, Math.round(asNumber(raw.minutes, 60)))),
		distance: raw.distance === true,
		metrics,
		photo: asString(raw.photo, "handstand"),
		createdAt: asString(raw.createdAt, new Date(0).toISOString()),
	};
}

/** A new metric for an activity, keyed from its label. */
export function newMetric(label: string, unit: string): ActivityMetric {
	return metric(label.trim().slice(0, 24), unit.trim().slice(0, 8));
}
