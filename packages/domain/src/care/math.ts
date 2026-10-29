import type { ColorTokens } from "@personal-os/tokens";
import { addDays, dayKey } from "../dates";
import type { CareDay, CareSettings, CheckIn, Metric, Product, Routine, Step } from "./model";

/** The numbers behind Care's screens. Pure, so they're tested without a phone. */

const DAY_MS = 86_400_000;

const dateOf = (day: string) => new Date(`${day}T12:00:00`);

export function emptyDay(day: string): CareDay {
	return { id: day, steps: {}, habits: [], skipped: [], finished: [] };
}

/** The steps of `routine` that happen on `day`, in order. */
export function stepsOn(steps: readonly Step[], routine: Routine, day: string): Step[] {
	const weekday = dateOf(day).getDay();
	return steps
		.filter(
			(step) => step.routine === routine && (step.days.length === 0 || step.days.includes(weekday)),
		)
		.sort((a, b) => a.order - b.order);
}

export function doneCount(steps: readonly Step[], record: CareDay | null): number {
	return record ? steps.filter((step) => record.steps[step.id]).length : 0;
}

/** Ticks or unticks a step, and freezes the routine as finished once every step is done. */
export function toggleStep(
	record: CareDay,
	step: Step,
	routineSteps: readonly Step[],
	now: Date,
): CareDay {
	const steps = { ...record.steps };
	if (steps[step.id]) delete steps[step.id];
	else steps[step.id] = now.toISOString();
	const complete = routineSteps.length > 0 && routineSteps.every((item) => steps[item.id]);
	const finished = complete
		? [...new Set([...record.finished, step.routine])]
		: record.finished.filter((routine) => routine !== step.routine);
	return {
		...record,
		steps,
		finished,
		skipped: record.skipped.filter((item) => item !== step.routine),
	};
}

/** Every step of a routine done at once ("did my morning routine"). */
export function finishRoutine(record: CareDay, routineSteps: readonly Step[], now: Date): CareDay {
	const steps = { ...record.steps };
	for (const step of routineSteps) steps[step.id] ??= now.toISOString();
	const routine = routineSteps[0]?.routine;
	return {
		...record,
		steps,
		finished: routine ? [...new Set([...record.finished, routine])] : record.finished,
	};
}

/** Days in a row with a finished routine, counting back from today (or yesterday, if today is
 * still open). */
export function streak(days: readonly CareDay[], now: Date): number {
	const finished = new Set(days.filter((day) => day.finished.length > 0).map((day) => day.id));
	let cursor = finished.has(dayKey(now)) ? now : addDays(now, -1);
	let count = 0;
	while (finished.has(dayKey(cursor))) {
		count += 1;
		cursor = addDays(cursor, -1);
	}
	return count;
}

/** Until this hour the night still belongs to the day before. */
const NIGHT_ENDS_HOUR = 4;

/**
 * The date whose care record is open now: before 04:00 it is still last night, so a night step
 * ticked at 00:30 finishes yesterday's night routine rather than starting today's morning.
 */
export function careDate(now: Date): Date {
	return now.getHours() < NIGHT_ENDS_HOUR ? addDays(now, -1) : now;
}

/** Night until 04:00, morning until 15:00, then night again. */
export function currentRoutine(now: Date): Routine {
	const hour = now.getHours();
	return hour >= NIGHT_ENDS_HOUR && hour < 15 ? "morning" : "night";
}

// --- shelf --------------------------------------------------------------------------------------

export type Supply = { share: number; daysLeft: number; label: string; tone: keyof ColorTokens };

/** How much of a product is left, from when it was opened and how long one lasts. */
export function supply(product: Product, now: Date): Supply | null {
	if (product.lastsDays <= 0) return null;
	const used = Math.max(
		0,
		Math.round((dateOf(dayKey(now)).getTime() - dateOf(product.openedOn).getTime()) / DAY_MS),
	);
	const daysLeft = Math.max(0, product.lastsDays - used);
	const share = daysLeft / product.lastsDays;
	return {
		share,
		daysLeft,
		label: leftLabel(daysLeft),
		tone: daysLeft <= 14 ? "statusCaution" : share < 0.5 ? "accentDefault" : "statusSuccess",
	};
}

/** "10 days", "2 weeks", "7 weeks", "2 months". */
export function leftLabel(days: number): string {
	if (days <= 0) return "Empty";
	if (days < 14) return `${days} day${days === 1 ? "" : "s"}`;
	if (days < 56) return `${Math.round(days / 7)} weeks`;
	return `${Math.round(days / 30)} months`;
}

/** Consumables, emptiest first. */
export function runningLow(
	products: readonly Product[],
	now: Date,
): (Product & { left: Supply })[] {
	return products
		.flatMap((product) => {
			const left = supply(product, now);
			return left ? [{ ...product, left }] : [];
		})
		.sort((a, b) => a.left.share - b.left.share);
}

/** Rupees a month to keep the shelf stocked. */
export function monthlyCost(products: readonly Product[]): number {
	return Math.round(
		products.reduce(
			(sum, product) =>
				product.lastsDays > 0 ? sum + (product.price * 30) / product.lastsDays : sum,
			0,
		),
	);
}

/** Products that run out within `days`, to reorder together. */
export function reorderSoon(products: readonly Product[], now: Date, days = 14) {
	const soon = runningLow(products, now).filter((product) => product.left.daysLeft <= days);
	return { products: soon, total: soon.reduce((sum, product) => sum + product.price, 0) };
}

// --- week ---------------------------------------------------------------------------------------

export type WeekCell = {
	day: string;
	/** "M", "T"… */
	letter: string;
	label: string;
	state: "done" | "missed" | "today" | "planned" | "none";
};

/** The week strip: the weekly (not daily) steps, and whether they were done. */
export function weekStrip(
	steps: readonly Step[],
	days: readonly CareDay[],
	week: readonly string[],
	today: string,
): WeekCell[] {
	const weekly = steps.filter((step) => step.days.length > 0);
	return week.map((day) => {
		const weekday = dateOf(day).getDay();
		const due = weekly
			.filter((step) => step.days.includes(weekday))
			.sort((a, b) => a.order - b.order);
		const record = days.find((item) => item.id === day);
		const first = due[0];
		const letter = "SMTWTFS"[weekday] ?? "";
		if (!first) return { day, letter, label: "", state: day === today ? "today" : "none" };
		const done = due.some((step) => record?.steps[step.id]);
		const state = done ? "done" : day === today ? "today" : day < today ? "missed" : "planned";
		return { day, letter, label: first.short || first.name, state };
	});
}

/** Monday to Sunday of the week `date` is in. */
export function weekDays(date: Date): string[] {
	const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
	return Array.from({ length: 7 }, (_, step) => dayKey(addDays(monday, step)));
}

// --- check-ins ----------------------------------------------------------------------------------

export type Rating = { word: string; tone: keyof ColorTokens };

/** 1–2 good, 3 okay, 4–5 needs a look. */
export function ratingWord(value: number): Rating {
	if (value <= 2) return { word: "Good", tone: "textSuccess" };
	if (value === 3) return { word: "Okay", tone: "textLink" };
	return { word: "Watch", tone: "textWarning" };
}

export function latestCheckIn(checkIns: readonly CheckIn[]): CheckIn | null {
	return [...checkIns].sort((a, b) => b.id.localeCompare(a.id))[0] ?? null;
}

/** The last `count` ratings of one metric, oldest first. */
export function trend(
	checkIns: readonly CheckIn[],
	metric: Metric,
	count = 8,
): { day: string; value: number }[] {
	return [...checkIns]
		.sort((a, b) => a.id.localeCompare(b.id))
		.flatMap((checkIn) => {
			const value = checkIn.ratings[metric];
			return value ? [{ day: checkIn.id, value }] : [];
		})
		.slice(-count);
}

/** Which metrics the check-in asks about, from the concerns. */
export function metricsFor(settings: CareSettings): Metric[] {
	const picked = new Set<Metric>();
	const concerns = new Set(settings.concerns);
	if (
		concerns.has("dryness") ||
		settings.skin.includes("dry") ||
		settings.skin.includes("sensitive")
	)
		picked.add("face-dryness");
	if (concerns.has("dark-spots")) picked.add("dark-spots");
	if (concerns.has("pores")) picked.add("pores");
	if (concerns.has("tan")) picked.add("tan");
	if (concerns.has("fine-lines")) picked.add("fine-lines");
	if (concerns.has("dandruff")) picked.add("dandruff");
	if (concerns.has("hair-density")) picked.add("hair-fall");
	if (concerns.has("early-greys")) picked.add("greys");
	if (concerns.has("nails")) picked.add("nails");
	if (picked.size === 0) picked.add("face-dryness");
	return [...picked];
}

/** Days until the next `weekday` (0 today). */
export function daysUntil(weekday: number, now: Date): number {
	return (weekday - now.getDay() + 7) % 7;
}

/** When a step was last done, in days, or null. */
export function lastDone(stepId: string, days: readonly CareDay[], now: Date): number | null {
	const found = [...days].sort((a, b) => b.id.localeCompare(a.id)).find((day) => day.steps[stepId]);
	if (!found) return null;
	return Math.max(
		0,
		Math.round((dateOf(dayKey(now)).getTime() - dateOf(found.id).getTime()) / DAY_MS),
	);
}

// --- month and insights -------------------------------------------------------------------------

/** Days with sunscreen ticked among `range`. */
export function spfDays(
	steps: readonly Step[],
	days: readonly CareDay[],
	range: readonly string[],
): number {
	const sunscreen = new Set(
		steps.filter((step) => /sunscreen|spf/i.test(step.name)).map((step) => step.id),
	);
	return range.filter((day) => {
		const record = days.find((item) => item.id === day);
		return record ? Object.keys(record.steps).some((id) => sunscreen.has(id)) : false;
	}).length;
}

export function monthDays(date: Date, upTo?: Date): string[] {
	const first = new Date(date.getFullYear(), date.getMonth(), 1);
	const out: string[] = [];
	for (let cursor = first; cursor.getMonth() === first.getMonth(); cursor = addDays(cursor, 1)) {
		if (upTo && cursor > upTo) break;
		out.push(dayKey(cursor));
	}
	return out;
}

export type CareNote =
	| { kind: "spf"; missed: number }
	| { kind: "winter" }
	| { kind: "dandruff"; from: number; to: number }
	| { kind: "check-in" };

/** What the Insights screen noticed, most useful first. */
export function careNotes(input: {
	settings: CareSettings;
	steps: readonly Step[];
	days: readonly CareDay[];
	checkIns: readonly CheckIn[];
	range: readonly string[];
	now: Date;
}): CareNote[] {
	const notes: CareNote[] = [];
	const logged = input.range.filter((day) => input.days.some((item) => item.id === day));
	const spf = spfDays(input.steps, input.days, input.range);
	if (
		input.settings.concerns.some((item) => item === "dark-spots" || item === "tan") &&
		logged.length > 0 &&
		spf < logged.length
	) {
		notes.push({ kind: "spf", missed: logged.length - spf });
	}
	const month = input.now.getMonth();
	if (month >= 9 || month <= 1) notes.push({ kind: "winter" });
	const flakes = trend(input.checkIns, "dandruff", 8);
	const first = flakes[0];
	const last = flakes.at(-1);
	if (first && last && flakes.length >= 3 && last.value < first.value) {
		notes.push({ kind: "dandruff", from: first.value, to: last.value });
	}
	const latest = latestCheckIn(input.checkIns);
	if (!latest || input.now.getTime() - dateOf(latest.id).getTime() > 8 * DAY_MS)
		notes.push({ kind: "check-in" });
	return notes;
}

// --- body today ---------------------------------------------------------------------------------

const WEEKDAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

export function weekdayName(day: number): string {
	return WEEKDAY_NAMES[day] ?? "Sunday";
}

type Tile = { label: string; text: string; tone: keyof ColorTokens };

function metricTile(
	label: string,
	checkIn: CheckIn | null,
	metrics: readonly Metric[],
	fallback: string,
): Tile {
	const rated = metrics.flatMap((metric) => {
		const value = checkIn?.ratings[metric];
		return value ? [{ metric, value }] : [];
	});
	const worst = rated.sort((a, b) => b.value - a.value)[0];
	if (!worst || !checkIn) return { label, text: fallback, tone: "textSecondary" };
	const rating = ratingWord(worst.value);
	return { label, text: checkIn.notes[worst.metric] ?? rating.word, tone: rating.tone };
}

/** Face, scalp, body and nails from the latest check-in and the nail day. */
export function bodyTiles(
	checkIn: CheckIn | null,
	steps: readonly Step[],
	days: readonly CareDay[],
	now: Date,
): Tile[] {
	const nails = steps.find((step) => /nail/i.test(step.name) && step.days.length > 0);
	const nailAgo = nails ? lastDone(nails.id, days, now) : null;
	const nailDay = nails?.days[0];
	return [
		metricTile(
			"Face",
			checkIn,
			["face-dryness", "dark-spots", "pores", "fine-lines"],
			"Check in Sunday",
		),
		metricTile("Scalp", checkIn, ["dandruff", "hair-fall", "greys"], "Not rated yet"),
		metricTile("Body", checkIn, ["tan"], "Lotion at night"),
		{
			label: "Nails",
			text:
				nailAgo === 0
					? "Done today"
					: nailDay === undefined
						? "Weekly trim"
						: `Trim ${daysUntil(nailDay, now) === 0 ? "today" : weekdayName(nailDay)}`,
			tone: nailAgo === 0 ? "textSuccess" : "textPrimary",
		},
	];
}
