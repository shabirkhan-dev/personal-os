import { addDays, dayKey } from "@/lib/day";
import { type Ayah, ayahs } from "./ayahs";
import { MOMENTS, type Moment } from "./faith-content";
import type {
	Challenge,
	FaithSettings,
	PrayerLog,
	PrayerStatus,
	RecitationSession,
	TasbihDay,
	TasbihPhrase,
	ZakatPayment,
	ZakatProfile,
} from "./faith-model";
import {
	dayTimes,
	hhmm,
	PRAYER_LABELS,
	type PrayerId,
	slots,
	type TimesSource,
	untilLabel,
} from "./prayer-times";

/** Pure Faith calculations: today's prayers, consistency, recaps, zakat and the Hijri date. */

const MINUTE = 60_000;
const DAY_MS = 24 * 60 * MINUTE;

export function timesSource(settings: FaithSettings): TimesSource {
	return {
		place: settings.place,
		method: settings.method,
		asr: settings.asr,
		manual: settings.manual,
	};
}

export function logId(day: string, prayer: PrayerId): string {
	return `${day}:${prayer}`;
}

// --- today ------------------------------------------------------------------------------------

/** Where a prayer stands right now. "due" = its time passed and nothing is logged yet. */
export type RowState = PrayerStatus | "due" | "next" | "later";

export type PrayerRow = {
	prayer: PrayerId;
	/** The prayer day the row belongs to: yesterday's until today's Fajr. */
	day: string;
	label: string;
	at: Date;
	state: RowState;
	log: PrayerLog | null;
	/** "05:06 · on time", "Reminder 10 min before", "Missed today · that's okay". */
	note: string;
	/** Right-hand pill: "Prayed", "in 2h 10m", "Later", "Missed", "Log it". */
	pill: string;
};

/** A log counts as on time within this long after the prayer's start. */
const ON_TIME_MINUTES = 60;

export function statusFor(at: Date, loggedAt: Date): PrayerStatus {
	return loggedAt.getTime() - at.getTime() <= ON_TIME_MINUTES * MINUTE ? "prayed" : "late";
}

/**
 * The date whose prayers are the current ones. The night belongs to the day before until Fajr, so
 * at 00:30 the Isha to log is last night's, not tonight's.
 */
export function prayerDate(settings: FaithSettings, now: Date): Date {
	const fajr = dayTimes(timesSource(settings), now).prayers.fajr;
	const beforeDawn = fajr ? now < fajr : now.getHours() < 4;
	return beforeDawn ? addDays(now, -1) : now;
}

/**
 * The log for one prayer, or null when its time hasn't come: a prayer can't be prayed (or
 * missed) before it is due. Without a status it is "prayed" or "late" by when it is logged.
 */
export function prayerLogFor(
	prayer: PrayerId,
	input: { day: string; prayerAt: Date | null; status?: PrayerStatus; now: Date },
): PrayerLog | null {
	const { day, prayerAt, now } = input;
	if (prayerAt && prayerAt > now) return null;
	const status = input.status ?? (prayerAt ? statusFor(prayerAt, now) : "prayed");
	return { id: logId(day, prayer), day, prayer, status, at: now.toISOString() };
}

export function todayRows(
	settings: FaithSettings,
	logs: readonly PrayerLog[],
	now: Date,
): PrayerRow[] {
	const date = prayerDate(settings, now);
	const day = dayKey(date);
	const list = slots(dayTimes(timesSource(settings), date), settings.prayers);
	const nextIndex = list.findIndex((slot) => slot.at > now);
	return list.map((slot, index) => {
		const log = logs.find((item) => item.id === logId(day, slot.prayer)) ?? null;
		const reminder = settings.reminders[slot.prayer] !== false;
		const state: RowState = log
			? log.status
			: slot.at <= now
				? "due"
				: index === nextIndex
					? "next"
					: "later";
		const note = {
			prayed: log ? `${hhmm(new Date(log.at))} · on time` : "",
			late: log ? `${hhmm(new Date(log.at))} · a little late` : "",
			missed: "Missed today · that's okay",
			due: "Tap to log it",
			next: reminder ? `Reminder ${settings.reminderLead} min before` : "Reminder off",
			later: reminder ? "Reminder on" : "Reminder off",
		}[state];
		const pill = {
			prayed: "Prayed",
			late: "Late",
			missed: "Missed",
			due: "Log it",
			next: `in ${untilLabel(slot.at.getTime() - now.getTime())}`,
			later: "Later",
		}[state];
		return {
			prayer: slot.prayer,
			day,
			label: PRAYER_LABELS[slot.prayer],
			at: slot.at,
			state,
			log,
			note,
			pill,
		};
	});
}

export function prayedCount(rows: readonly PrayerRow[]): number {
	return rows.filter((row) => row.state === "prayed" || row.state === "late").length;
}

/** The prayer a bare "prayed" means: the latest one whose time has come and isn't logged. */
export function currentPrayer(rows: readonly PrayerRow[]): PrayerRow | null {
	const due = rows.filter((row) => row.state === "due");
	return due.at(-1) ?? null;
}

/** A missed prayer today, for the "Never miss twice" card. */
export function missedToday(rows: readonly PrayerRow[]): PrayerRow | null {
	return rows.find((row) => row.state === "missed") ?? null;
}

// --- consistency ------------------------------------------------------------------------------

export type GridCell = { day: string; state: PrayerStatus | "none" };
export type GridRow = { prayer: PrayerId; cells: GridCell[] };

/** One row per prayer, one cell per day, oldest first. Today counts only once it is logged. */
export function consistencyGrid(
	logs: readonly PrayerLog[],
	prayers: readonly PrayerId[],
	now: Date,
	days = 10,
): GridRow[] {
	const byId = new Map(logs.map((log) => [log.id, log]));
	const keys = Array.from({ length: days }, (_, index) => dayKey(addDays(now, index - days + 1)));
	return prayers.map((prayer) => ({
		prayer,
		cells: keys.map((day) => ({ day, state: byId.get(logId(day, prayer))?.status ?? "none" })),
	}));
}

/** Days in a row, ending today or yesterday, on which `test` holds. */
function runOfDays(test: (day: string) => boolean, now: Date): number {
	let cursor = test(dayKey(now)) ? now : addDays(now, -1);
	let count = 0;
	while (test(dayKey(cursor)) && count < 3650) {
		count += 1;
		cursor = addDays(cursor, -1);
	}
	return count;
}

export function prayerStreak(logs: readonly PrayerLog[], prayer: PrayerId, now: Date): number {
	const onTime = new Set(
		logs.filter((log) => log.prayer === prayer && log.status === "prayed").map((log) => log.day),
	);
	return runOfDays((day) => onTime.has(day), now);
}

// --- recitation -------------------------------------------------------------------------------

export function recitedOn(sessions: readonly RecitationSession[], day: string): number {
	return sessions.filter((session) => session.day === day).reduce((sum, s) => sum + s.minutes, 0);
}

export function recitationStreak(sessions: readonly RecitationSession[], now: Date): number {
	const days = new Set(sessions.filter((s) => s.minutes > 0).map((s) => s.day));
	return runOfDays((day) => days.has(day), now);
}

/** Monday of the week `date` is in. */
export function weekStart(date: Date): Date {
	const out = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
	return out;
}

export type PlanDay = {
	day: string;
	weekday: string;
	title: string;
	detail: string;
	done: boolean;
	today: boolean;
};

const PLAN = [
	{ title: "One page", detail: "Read it aloud, then the translation" },
	{ title: "One page", detail: "Read it aloud, then the translation" },
	{ title: "Revise", detail: "Read Monday's and Tuesday's pages again" },
	{ title: "One page", detail: "Right after Fajr" },
	{ title: "Reflect", detail: "Write one line about what stayed with you" },
] as const;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** The five-day recitation week (Mon–Fri), with what is done. */
export function recitationWeek(sessions: readonly RecitationSession[], now: Date): PlanDay[] {
	const monday = weekStart(now);
	const today = dayKey(now);
	return PLAN.map((step, index) => {
		const day = dayKey(addDays(monday, index));
		return {
			day,
			weekday: WEEKDAYS[index] ?? "",
			title: step.title,
			detail: step.detail,
			done: recitedOn(sessions, day) > 0,
			today: day === today,
		};
	});
}

// --- recap and insights -----------------------------------------------------------------------

export type WeekRecap = {
	prayed: number;
	possible: number;
	onTimeShare: number;
	recitationMinutes: number;
	/** Most missed or late prayer this week, if any slipped. */
	slipped: { prayer: PrayerId; count: number; lastDay: string } | null;
	/** Prayers kept every day of the week. */
	perfect: PrayerId[];
};

export function weekRecap(
	logs: readonly PrayerLog[],
	sessions: readonly RecitationSession[],
	prayers: readonly PrayerId[],
	from: Date,
	days: number,
): WeekRecap {
	const keys = new Set(Array.from({ length: days }, (_, index) => dayKey(addDays(from, index))));
	const inRange = logs.filter((log) => keys.has(log.day) && prayers.includes(log.prayer));
	const prayed = inRange.filter((log) => log.status !== "missed");
	const onTime = prayed.filter((log) => log.status === "prayed").length;
	const slips = new Map<PrayerId, { count: number; lastDay: string }>();
	for (const log of inRange) {
		if (log.status === "prayed") continue;
		const entry = slips.get(log.prayer) ?? { count: 0, lastDay: log.day };
		slips.set(log.prayer, {
			count: entry.count + 1,
			lastDay: log.day > entry.lastDay ? log.day : entry.lastDay,
		});
	}
	let slipped: WeekRecap["slipped"] = null;
	for (const [prayer, entry] of slips) {
		if (!slipped || entry.count > slipped.count) slipped = { prayer, ...entry };
	}
	const perfect = prayers.filter(
		(prayer) =>
			inRange.filter((log) => log.prayer === prayer && log.status === "prayed").length === days,
	);
	return {
		prayed: prayed.length,
		possible: prayers.length * days,
		onTimeShare: prayed.length > 0 ? onTime / prayed.length : 0,
		recitationMinutes: sessions
			.filter((session) => keys.has(session.day))
			.reduce((sum, session) => sum + session.minutes, 0),
		slipped,
		perfect,
	};
}

export type InsightAction = "earlier-reminder" | "fajr-alarm" | "recite-after-fajr" | "reminders";
export type Insight = {
	id: string;
	label: string;
	body: string;
	action: { label: string; kind: InsightAction };
};

/** "What I noticed": a few plain observations from the last 30 days, worked out on the phone. */
export function insights(
	logs: readonly PrayerLog[],
	sessions: readonly RecitationSession[],
	settings: FaithSettings,
	now: Date,
): Insight[] {
	const out: Insight[] = [];
	const since = dayKey(addDays(now, -29));
	const recent = logs.filter((log) => log.day >= since && settings.prayers.includes(log.prayer));
	const slips = new Map<PrayerId, number>();
	for (const log of recent) {
		if (log.status !== "prayed") slips.set(log.prayer, (slips.get(log.prayer) ?? 0) + 1);
	}
	const worst = [...slips.entries()].sort((a, b) => b[1] - a[1])[0];
	if (worst && worst[1] >= 2) {
		const label = PRAYER_LABELS[worst[0]];
		out.push({
			id: "most-missed",
			label,
			body: `${label} is the prayer that slips most: ${worst[1]} times this month. A reminder 15 minutes earlier would help.`,
			action: { label: "Move reminder earlier", kind: "earlier-reminder" },
		});
	}
	const fajrLate = recent.filter((log) => log.prayer === "fajr" && log.status !== "prayed").length;
	if (settings.prayers.includes("fajr") && fajrLate >= 2) {
		out.push({
			id: "fajr",
			label: "Fajr and sleep",
			body: `Fajr slipped ${fajrLate} times this month. An earlier night makes the morning easier; an alarm before Fajr helps too.`,
			action: { label: "Set a Fajr alarm", kind: "fajr-alarm" },
		});
	}
	const morning = sessions.filter((s) => new Date(s.at).getHours() < 9);
	const morningMinutes = morning.reduce((sum, s) => sum + s.minutes, 0);
	const otherMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0) - morningMinutes;
	if (morning.length >= 3 && morningMinutes > otherMinutes) {
		out.push({
			id: "recitation",
			label: "Recitation",
			body: "You recite longer in the morning than later in the day. Keeping it right after Fajr protects your streak.",
			action: { label: "Remind me after Fajr", kind: "recite-after-fajr" },
		});
	}
	if (out.length === 0) {
		out.push({
			id: "start",
			label: "Getting started",
			body:
				recent.length === 0
					? "Log a few prayers and I'll start noticing patterns: which one slips, and when you recite best."
					: "Steady so far. Keep logging and I'll point out what helps.",
			action: { label: "Check reminders", kind: "reminders" },
		});
	}
	return out;
}

// --- ayah and moments -------------------------------------------------------------------------

/** The day's ayah; `offset` moves through the list when the person taps Another. */
export function ayahOfTheDay(now: Date, offset = 0): Ayah {
	const index = Math.floor(new Date(dayKey(now)).getTime() / DAY_MS) + offset;
	const list = ayahs;
	return list[((index % list.length) + list.length) % list.length] as Ayah;
}

/** Which card Home shows: a dua on waking or before sleep, the ayah of the day otherwise. */
export function momentAt(now: Date, done: readonly string[]): Moment | null {
	const hour = now.getHours() + now.getMinutes() / 60;
	const day = dayKey(now);
	if (hour >= 3.5 && hour < 9 && !done.includes(`${day}:wake`)) return MOMENTS.wake;
	if ((hour >= 21.5 || hour < 2) && !done.includes(`${day}:sleep`)) return MOMENTS.sleep;
	return null;
}

// --- tasbih -----------------------------------------------------------------------------------

export type TasbihProgress = {
	/** The phrase being counted now. */
	index: number;
	count: number;
	target: number;
	/** Sets finished in the sequence. */
	setsDone: number;
	total: number;
};

/** Where the person is in their sequence today. */
export function tasbihProgress(
	sequence: readonly TasbihPhrase[],
	today: TasbihDay | null,
	selected?: string,
): TasbihProgress {
	const counts = today?.counts ?? {};
	const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
	const setsDone = sequence.filter((phrase) => (counts[phrase.id] ?? 0) >= phrase.target).length;
	const picked = selected ? sequence.findIndex((phrase) => phrase.id === selected) : -1;
	const firstOpen = sequence.findIndex((phrase) => (counts[phrase.id] ?? 0) < phrase.target);
	const index =
		picked >= 0 ? picked : firstOpen >= 0 ? firstOpen : Math.max(0, sequence.length - 1);
	const phrase = sequence[index];
	return {
		index,
		count: phrase ? (counts[phrase.id] ?? 0) : 0,
		target: phrase?.target ?? 33,
		setsDone,
		total,
	};
}

// --- zakat ------------------------------------------------------------------------------------

export type ZakatView = {
	owned: number;
	/** Owned minus debts due now. */
	net: number;
	aboveNisab: boolean;
	due: number;
	/** Paid within the current hawl only. */
	paid: number;
	left: number;
	/** The current lunar year of holding, rolled forward each year; null without a start date. */
	hawl: Hawl | null;
	/** Lunar months held since the current hawl started, 0–12. */
	monthsHeld: number;
	monthsLeft: number;
};

export type Hawl = { start: Date; end: Date };

const LUNAR_MONTH_DAYS = 29.530588;
const LUNAR_YEAR_DAYS = 354;

/**
 * The hawl running now: the first one starts on `hawlStart`, and each lunar year (354 days) a new
 * one begins, so last year's payments don't count towards this year's zakat.
 */
export function currentHawl(hawlStart: string | null, now: Date): Hawl | null {
	if (!hawlStart) return null;
	const first = new Date(`${hawlStart}T00:00:00`);
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const days = Math.round((today.getTime() - first.getTime()) / DAY_MS);
	const years = days > 0 ? Math.floor(days / LUNAR_YEAR_DAYS) : 0;
	const start = addDays(first, years * LUNAR_YEAR_DAYS);
	return { start, end: addDays(start, LUNAR_YEAR_DAYS) };
}

export function zakatView(
	profile: ZakatProfile,
	payments: readonly ZakatPayment[],
	now: Date,
): ZakatView {
	const owned = profile.gold + profile.cash + profile.savings;
	const net = Math.max(0, owned - profile.debts);
	const aboveNisab = net >= profile.nisab && net > 0;
	const due = aboveNisab ? Math.round(net * profile.rate) : 0;
	const hawl = currentHawl(profile.hawlStart, now);
	const monthsHeld = hawl
		? Math.min(
				12,
				Math.max(
					0,
					Math.floor((now.getTime() - hawl.start.getTime()) / (LUNAR_MONTH_DAYS * DAY_MS)),
				),
			)
		: 0;
	const since = hawl?.start ?? addDays(now, -LUNAR_YEAR_DAYS);
	const paid = payments
		.filter((payment) => new Date(payment.at) >= since)
		.reduce((sum, payment) => sum + payment.amount, 0);
	return {
		owned,
		net,
		aboveNisab,
		due,
		paid,
		left: Math.max(0, due - paid),
		hawl,
		monthsHeld,
		monthsLeft: 12 - monthsHeld,
	};
}

/** A typed "YYYY-MM-DD" that is a real day: "2026-02-30" is refused, not rolled into March. */
export function isCalendarDay(text: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
	const date = new Date(`${text}T00:00:00`);
	return !Number.isNaN(date.getTime()) && dayKey(date) === text;
}

/** A typed zakat rate in percent ("2.5") as a share (0.025); empty, zero or over 100 is null. */
export function parseRate(text: string): number | null {
	const trimmed = text.trim();
	if (!trimmed) return null;
	const value = Number(trimmed);
	return Number.isFinite(value) && value > 0 && value <= 100 ? value / 100 : null;
}

/** "1.5L", "70k", "3,20,000": Pakistani short amounts as the Zakat frame shows them. */
export function shortRupees(amount: number): string {
	if (amount >= 100_000) return `${trim(amount / 100_000)}L`;
	if (amount >= 1000) return `${trim(amount / 1000)}k`;
	return String(Math.round(amount));
}

function trim(value: number): string {
	return value.toFixed(1).replace(/\.0$/, "");
}

/** "3,20,000" (lakh grouping). */
export function lakhs(amount: number): string {
	const whole = String(Math.round(Math.abs(amount)));
	const last3 = whole.slice(-3);
	const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
	return `${amount < 0 ? "−" : ""}${rest ? `${rest},` : ""}${last3}`;
}

// --- hijri ------------------------------------------------------------------------------------

export const HIJRI_MONTHS = [
	"Muharram",
	"Safar",
	"Rabi al-Awwal",
	"Rabi al-Thani",
	"Jumada al-Ula",
	"Jumada al-Thani",
	"Rajab",
	"Sha'ban",
	"Ramadan",
	"Shawwal",
	"Dhu al-Qa'dah",
	"Dhu al-Hijjah",
] as const;

export type HijriDate = { year: number; month: number; day: number };

/**
 * The tabular Islamic calendar (civil epoch). It can differ from the local moon sighting by a day
 * or two, which is fine for labels like "1447 AH" and the zakat year.
 */
export function toHijri(date: Date): HijriDate {
	const jdn = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS + 2440588;
	let l = jdn - 1948440 + 10632;
	const n = Math.floor((l - 1) / 10631);
	l = l - 10631 * n + 354;
	const j =
		Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
		Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
	l =
		l -
		Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
		Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
		29;
	const month = Math.floor((24 * l) / 709);
	const day = l - Math.floor((709 * month) / 24);
	return { year: 30 * n + j - 30, month, day };
}

export function hijriMonthName(month: number): string {
	return HIJRI_MONTHS[(month - 1 + 12) % 12] ?? "";
}

// --- challenge --------------------------------------------------------------------------------

export function challengeDay(challenge: Challenge, now: Date): number {
	const start = new Date(`${challenge.startedOn}T00:00:00`);
	const elapsed = Math.floor(
		(new Date(dayKey(now)).getTime() - new Date(dayKey(start)).getTime()) / DAY_MS,
	);
	return Math.min(challenge.days, Math.max(1, elapsed + 1));
}

export function challengeShare(challenge: Challenge): number {
	return challenge.done.length / challenge.days;
}

// --- dates ------------------------------------------------------------------------------------

const MONTHS_SHORT = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;
const WEEKDAY_NAMES = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
] as const;

/** "6 Oct", without relying on Intl (Hermes has only part of it). */
export function shortDate(date: Date): string {
	return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()] ?? ""}`;
}

export function weekdayName(date: Date): string {
	return WEEKDAY_NAMES[date.getDay()] ?? "";
}

/** "today", "yesterday", "3 days ago". */
export function daysAgo(iso: string, now: Date): string {
	const days = Math.round(
		(new Date(dayKey(now)).getTime() - new Date(dayKey(new Date(iso))).getTime()) / DAY_MS,
	);
	if (days <= 0) return "today";
	return days === 1 ? "yesterday" : `${days} days ago`;
}
