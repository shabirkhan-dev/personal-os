import { removeItem, saveItem } from "@/lib/db/collection";
import { dayKey, newId } from "@/lib/day";
import { type Rating, review } from "@/lib/flashcards/schedule";
import { type ChallengeTemplate, STARTER_CARDS } from "../lib/faith-content";
import { prayerLogFor } from "../lib/faith-math";
import type {
	Challenge,
	FaithCard,
	FaithSettings,
	PathProgress,
	PrayerLog,
	PrayerStatus,
	Resource,
	ResourceKind,
	TasbihDay,
	ZakatPayment,
	ZakatProfile,
} from "../lib/faith-model";
import { PRAYER_LABELS, type PrayerId } from "../lib/prayer-times";
import {
	challenges,
	faithCards,
	faithSettings,
	pathProgress,
	prayerLogs,
	recitations,
	resources,
	tasbihDays,
	zakatPayments,
	zakatProfiles,
} from "./collections";

/** Every Faith write. Each saves to the record store, which refreshes the screens and syncs. */

export function saveSettings(settings: FaithSettings): Promise<void> {
	return saveItem(faithSettings, settings);
}

/**
 * Logs one prayer under its prayer day (a row's `day`: last night's Isha stays last night's after
 * midnight). Without a status it is "prayed" or "late" depending on how long after the prayer's
 * time it is logged. A prayer whose time hasn't come is refused.
 */
export async function logPrayer(
	prayer: PrayerId,
	options: { status?: PrayerStatus; prayerAt?: Date | null; day?: string; now?: Date } = {},
): Promise<PrayerLog> {
	const now = options.now ?? new Date();
	const prayerAt = options.prayerAt ?? null;
	const log = prayerLogFor(prayer, {
		day: options.day ?? dayKey(prayerAt ?? now),
		prayerAt,
		status: options.status,
		now,
	});
	if (!log) throw new Error(`${PRAYER_LABELS[prayer]} isn't due yet.`);
	await saveItem(prayerLogs, log);
	return log;
}

export function restoreLog(previous: PrayerLog | null, current: PrayerLog): Promise<void> {
	return previous ? saveItem(prayerLogs, previous) : removeItem(prayerLogs, current.id);
}

export async function addRecitation(minutes: number, now = new Date()): Promise<void> {
	if (minutes <= 0) return;
	await saveItem(recitations, {
		id: newId(),
		day: dayKey(now),
		minutes: Math.round(minutes * 10) / 10,
		at: now.toISOString(),
	});
}

export function saveTasbih(day: TasbihDay): Promise<void> {
	return saveItem(tasbihDays, day);
}

export function saveZakat(profile: ZakatProfile): Promise<void> {
	return saveItem(zakatProfiles, profile);
}

export async function addPayment(
	input: Omit<ZakatPayment, "id" | "at">,
	now = new Date(),
): Promise<void> {
	await saveItem(zakatPayments, { ...input, id: newId(), at: now.toISOString() });
}

export function removePayment(payment: ZakatPayment): Promise<void> {
	return removeItem(zakatPayments, payment.id);
}

export async function saveResource(
	input: {
		id?: string;
		kind: ResourceKind;
		title: string;
		body: string;
		url: string;
		createdAt?: string;
	},
	now = new Date(),
): Promise<void> {
	const at = now.toISOString();
	const resource: Resource = {
		id: input.id ?? newId(),
		kind: input.kind,
		title: input.title.trim(),
		body: input.body.trim(),
		url: input.url.trim(),
		createdAt: input.createdAt ?? at,
		updatedAt: at,
	};
	await saveItem(resources, resource);
}

export function removeResource(resource: Resource): Promise<void> {
	return removeItem(resources, resource.id);
}

export async function startChallenge(template: ChallengeTemplate, now = new Date()): Promise<void> {
	const challenge: Challenge = {
		id: "challenge",
		title: template.title,
		detail: template.detail,
		days: template.days,
		startedOn: dayKey(now),
		done: [],
	};
	await saveItem(challenges, challenge);
}

export async function toggleChallengeDay(challenge: Challenge, now = new Date()): Promise<void> {
	const day = dayKey(now);
	const done = challenge.done.includes(day)
		? challenge.done.filter((item) => item !== day)
		: [...challenge.done, day];
	await saveItem(challenges, { ...challenge, done });
}

export async function toggleLesson(
	pathId: string,
	lessonId: string,
	progress: PathProgress | undefined,
): Promise<void> {
	const done = progress?.done ?? [];
	await saveItem(pathProgress, {
		id: pathId,
		done: done.includes(lessonId) ? done.filter((id) => id !== lessonId) : [...done, lessonId],
	});
}

/** Adds the starter deck the first time the person opens flashcards. */
export async function seedCards(existing: readonly FaithCard[], now = new Date()): Promise<void> {
	const have = new Set(existing.map((card) => card.id));
	const dueAt = now.toISOString();
	await Promise.all(
		STARTER_CARDS.filter((card) => !have.has(card.id)).map((card) =>
			saveItem(faithCards, { ...card, dueAt, intervalMinutes: 0, reps: 0 }),
		),
	);
}

export function rateCard(card: FaithCard, rating: Rating, now = new Date()): Promise<void> {
	return saveItem(faithCards, review(card, rating, now));
}
