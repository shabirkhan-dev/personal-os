import { addDays } from "../dates";
import {
	DREAM_CATEGORIES,
	type Dream,
	type DreamCategory,
	type Owned,
	type Photo,
	type ServiceItem,
	type WishlistSettings,
} from "./model";

const DAY_MS = 86_400_000;
const DAYS_PER_MONTH = 365 / 12;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const roundCents = (value: number) => Math.round(value * 100) / 100;

// --- one dream ----------------------------------------------------------------------------------

/**
 * The photo file an edit leaves behind: the old one when it was a file and the dream now shows
 * something else, unless a garage item still uses it (Got it shares the dream's photo).
 */
export function replacedPhotoUri(
	before: Photo,
	after: Photo,
	owned: readonly Pick<Owned, "photo">[],
): string | null {
	if (before?.kind !== "file") return null;
	if (after?.kind === "file" && after.uri === before.uri) return null;
	const kept = owned.some((item) => item.photo?.kind === "file" && item.photo.uri === before.uri);
	return kept ? null : before.uri;
}

/** Share of the price put aside, 0–1. */
export function progress(dream: Pick<Dream, "price" | "savedAmount">): number {
	if (dream.price <= 0) return dream.savedAmount > 0 ? 1 : 0;
	return Math.min(1, Math.max(0, dream.savedAmount / dream.price));
}

export function progressPercent(dream: Pick<Dream, "price" | "savedAmount">): number {
	return Math.round(progress(dream) * 100);
}

export function amountLeft(dream: Pick<Dream, "price" | "savedAmount">): number {
	return roundCents(Math.max(0, dream.price - dream.savedAmount));
}

export function daysOnList(dream: Pick<Dream, "addedAt">, now: Date): number {
	return Math.max(0, Math.floor((now.getTime() - Date.parse(dream.addedAt)) / DAY_MS));
}

/** The 30-day cool-off: a dream can only be bought once it has waited. */
export function coolOff(
	dream: Pick<Dream, "addedAt">,
	settings: Pick<WishlistSettings, "coolOffDays">,
	now: Date,
): { passed: boolean; daysLeft: number; days: number } {
	const days = daysOnList(dream, now);
	const daysLeft = Math.max(0, settings.coolOffDays - days);
	return { passed: daysLeft === 0, daysLeft, days };
}

/** Days of saving at `daily` rupees a day to cover what's left; null when nothing is being saved. */
export function etaDays(left: number, daily: number): number | null {
	if (left <= 0) return 0;
	if (daily <= 0) return null;
	return Math.ceil(left / daily);
}

export function monthsFor(left: number, perMonth: number): number | null {
	if (left <= 0) return 0;
	if (perMonth <= 0) return null;
	return Math.ceil(left / perMonth);
}

// --- the list -----------------------------------------------------------------------------------

export function isOpen(dream: Pick<Dream, "status">): boolean {
	return dream.status !== "got";
}

/** Open dreams in the order they get money: priority, then the oldest first. */
export function inLine(dreams: readonly Dream[]): Dream[] {
	return dreams
		.filter(isOpen)
		.sort((a, b) => a.priority - b.priority || a.addedAt.localeCompare(b.addedAt));
}

/** The dream that gets the next rupee. */
export function upNext(dreams: readonly Dream[]): Dream | null {
	return inLine(dreams)[0] ?? null;
}

export function totalToSave(dreams: readonly Dream[]): number {
	return roundCents(inLine(dreams).reduce((sum, dream) => sum + amountLeft(dream), 0));
}

export function categoryCounts(dreams: readonly Dream[]): Record<DreamCategory, number> {
	const counts = {} as Record<DreamCategory, number>;
	for (const category of DREAM_CATEGORIES) counts[category] = 0;
	for (const dream of dreams) if (isOpen(dream)) counts[dream.category] += 1;
	return counts;
}

/** Priorities 1…n in the given order, so the list stays gap-free after a move or delete. */
export function renumber(dreams: readonly Dream[]): Dream[] {
	return dreams.map((dream, index) => ({ ...dream, priority: index + 1 }));
}

/** Moves `id` to `to` (0-based) in line and renumbers. */
export function moveInLine(dreams: readonly Dream[], id: string, to: number): Dream[] {
	const line = inLine(dreams);
	const from = line.findIndex((dream) => dream.id === id);
	if (from < 0) return line;
	const [moved] = line.splice(from, 1);
	if (!moved) return line;
	line.splice(Math.max(0, Math.min(line.length, to)), 0, moved);
	return renumber(line);
}

// --- saving rate and the roadmap ----------------------------------------------------------------

/** Money into dreams each month: the saving share of monthly income. */
export function monthlyForDreams(income: number, share: number): number {
	return Math.max(0, Math.round(income * share));
}

export function perDay(monthly: number): number {
	return monthly / DAYS_PER_MONTH;
}

export type RoadmapStop = {
	dream: Dream;
	left: number;
	/** Days from now until it is paid for, funding dreams one after another; null without saving. */
	days: number | null;
	ready: Date | null;
	/** The dream before it in line, which it waits on; null when it is first. */
	after: Dream | null;
};

/** Dreams funded one at a time in priority order at `monthly` a month. */
export function roadmap(dreams: readonly Dream[], monthly: number, now: Date): RoadmapStop[] {
	const daily = perDay(monthly);
	let total = 0;
	let previous: Dream | null = null;
	return inLine(dreams).map((dream) => {
		const left = amountLeft(dream);
		total += left;
		const days = etaDays(total, daily);
		const stop: RoadmapStop = {
			dream,
			left,
			days,
			ready: days === null ? null : addDays(now, days),
			after: previous,
		};
		previous = dream;
		return stop;
	});
}

/** "2027 · Q1" within 18 months, then "Early 2029" / "2029" / "Late 2029". */
export function whenLabel(date: Date, now: Date): string {
	const months = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
	const year = date.getFullYear();
	if (months <= 18) return `${year} · Q${Math.floor(date.getMonth() / 3) + 1}`;
	if (date.getMonth() <= 2) return `Early ${year}`;
	if (date.getMonth() >= 8) return `Late ${year}`;
	return String(year);
}

// --- money text ---------------------------------------------------------------------------------

/** "Rs 950", "Rs 45k", "Rs 650k", "Rs 3.8M", "Rs 12.7M". */
export function compactMoney(amount: number): string {
	const value = Math.max(0, amount);
	if (value >= 1_000_000) {
		const millions = value / 1_000_000;
		return `Rs ${millions >= 100 ? Math.round(millions) : Number(millions.toFixed(1))}M`;
	}
	if (value >= 1000) return `Rs ${Math.round(value / 1000)}k`;
	return `Rs ${Math.round(value)}`;
}

/** "Rs 650,000". */
export function fullMoney(amount: number): string {
	return `Rs ${Math.round(Math.max(0, amount)).toLocaleString("en-US")}`;
}

// --- the garage ---------------------------------------------------------------------------------

export type ServiceState = {
	/** Share of the interval used, 0–1+ (above 1 is overdue). */
	used: number;
	label: string;
	tone: "statusSuccess" | "statusCaution" | "statusDanger";
	due: boolean;
};

function stateTone(used: number): ServiceState["tone"] {
	if (used >= 1) return "statusDanger";
	if (used >= 0.75) return "statusCaution";
	return "statusSuccess";
}

export function serviceState(item: ServiceItem, owned: Pick<Owned, "km">, now: Date): ServiceState {
	if (item.everyKm && owned.km !== null) {
		const since = Math.max(0, owned.km - (item.lastKm ?? owned.km));
		const used = since / item.everyKm;
		const left = item.everyKm - since;
		return {
			used,
			label: left <= 0 ? "due now" : `${left.toLocaleString("en-US")} km left`,
			tone: stateTone(used),
			due: left <= 0,
		};
	}
	if (item.everyDays) {
		const last = item.lastAt ? new Date(item.lastAt) : now;
		const due = addDays(last, item.everyDays);
		const daysLeft = Math.ceil((due.getTime() - now.getTime()) / DAY_MS);
		const used = 1 - daysLeft / item.everyDays;
		const label =
			daysLeft <= 0
				? "due now"
				: daysLeft <= 6
					? `due ${WEEKDAYS[due.getDay()]}`
					: `${MONTHS[due.getMonth()]} ${due.getFullYear()}`;
		return { used: Math.max(0, used), label, tone: stateTone(used), due: daysLeft <= 0 };
	}
	return { used: 0, label: "no schedule", tone: "statusSuccess", due: false };
}

/** The most pressing service line for an owned thing, for the Home row. */
export function nextService(
	owned: Owned,
	now: Date,
): { item: ServiceItem; state: ServiceState } | null {
	let best: { item: ServiceItem; state: ServiceState } | null = null;
	for (const item of owned.service) {
		const state = serviceState(item, owned, now);
		if (!best || state.used > best.state.used) best = { item, state };
	}
	return best;
}

/** "4 years", "8 months", "new". */
export function ageLabel(boughtAt: string | null, now: Date): string | null {
	if (!boughtAt) return null;
	const months = Math.floor((now.getTime() - Date.parse(boughtAt)) / (DAY_MS * DAYS_PER_MONTH));
	if (months < 1) return "new";
	if (months < 12) return `${months} ${months === 1 ? "month" : "months"}`;
	const years = Math.floor(months / 12);
	return `${years} ${years === 1 ? "year" : "years"}`;
}

// --- insights -----------------------------------------------------------------------------------

export type InsightRange = "month" | "last" | "year";

export function rangeBounds(range: InsightRange, now: Date): { from: Date; to: Date } {
	if (range === "year") return { from: new Date(now.getFullYear(), 0, 1), to: now };
	if (range === "last") {
		return {
			from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
			to: new Date(now.getFullYear(), now.getMonth(), 1),
		};
	}
	return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
}

const within = (iso: string | null, from: Date, to: Date) => {
	if (!iso) return false;
	const time = Date.parse(iso);
	return time >= from.getTime() && time < to.getTime() + 1;
};

export type WishlistRecap = {
	open: number;
	added: number;
	addedPassedCoolOff: number;
	bought: number;
	spent: number;
	saved: number;
	/** Always 0: nothing is bought on interest. Shown so the rule stays visible. */
	interest: 0;
};

export function recap(
	dreams: readonly Dream[],
	settings: Pick<WishlistSettings, "coolOffDays">,
	range: InsightRange,
	now: Date,
): WishlistRecap {
	const { from, to } = rangeBounds(range, now);
	const added = dreams.filter((dream) => within(dream.addedAt, from, to));
	const bought = dreams.filter((dream) => dream.status === "got" && within(dream.gotAt, from, to));
	let saved = 0;
	for (const dream of dreams) {
		for (const item of dream.contributions) if (within(item.at, from, to)) saved += item.amount;
	}
	return {
		open: dreams.filter(isOpen).length,
		added: added.length,
		addedPassedCoolOff: added.filter((dream) => coolOff(dream, settings, now).passed).length,
		bought: bought.length,
		spent: roundCents(bought.reduce((sum, dream) => sum + dream.price, 0)),
		saved: roundCents(saved),
		interest: 0,
	};
}

export type WishlistNote =
	| { kind: "pays-first"; dream: Dream; first: boolean }
	| { kind: "late-night"; count: number }
	| { kind: "ready"; dream: Dream }
	| { kind: "stalled"; dream: Dream; days: number };

/** Plain observations from the list itself; nothing is guessed from outside data. */
export function wishlistNotes(
	dreams: readonly Dream[],
	settings: Pick<WishlistSettings, "coolOffDays">,
	range: InsightRange,
	now: Date,
): WishlistNote[] {
	const notes: WishlistNote[] = [];
	const line = inLine(dreams);
	const tool = line.find((dream) => dream.paysForItself);
	if (tool) notes.push({ kind: "pays-first", dream: tool, first: line[0]?.id === tool.id });

	const ready = line.find(
		(dream) => amountLeft(dream) === 0 && dream.price > 0 && coolOff(dream, settings, now).passed,
	);
	if (ready) notes.push({ kind: "ready", dream: ready });

	const saving = line.find((dream) => dream.status === "saving" && amountLeft(dream) > 0);
	if (saving) {
		const last = saving.contributions.reduce(
			(latest, item) => (item.at > latest ? item.at : latest),
			saving.addedAt,
		);
		const days = Math.floor((now.getTime() - Date.parse(last)) / DAY_MS);
		if (days >= 30) notes.push({ kind: "stalled", dream: saving, days });
	}

	const { from, to } = rangeBounds(range, now);
	const late = dreams.filter(
		(dream) => within(dream.addedAt, from, to) && new Date(dream.addedAt).getHours() < 5,
	).length;
	if (late > 0) notes.push({ kind: "late-night", count: late });
	return notes;
}
