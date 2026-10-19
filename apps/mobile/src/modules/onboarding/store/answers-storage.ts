import * as SecureStore from "@/lib/secure-store";
import { initialAnswers, type OnboardingAnswers } from "./onboarding-store";

const ANSWERS_KEY = "personal-os.onboarding.answers";
const UPDATED_AT_KEY = "personal-os.onboarding.answersUpdatedAt";

/**
 * Rebuilds answers from stored JSON. Unknown keys are dropped and any value whose type does not
 * match the defaults falls back to the default, so an old or damaged payload never crashes Home.
 */
export function mergeStoredAnswers(raw: unknown): OnboardingAnswers {
	if (typeof raw !== "object" || raw === null) return { ...initialAnswers };
	const stored = raw as Record<string, unknown>;
	const merged: Record<string, unknown> = { ...initialAnswers };
	for (const key of Object.keys(initialAnswers) as (keyof OnboardingAnswers)[]) {
		const fallback = initialAnswers[key];
		const value = stored[key];
		if (value === undefined) continue;
		const sameShape =
			Array.isArray(fallback) === Array.isArray(value) &&
			(typeof fallback === typeof value || (key === "gender" && typeof value === "string"));
		if (sameShape) merged[key] = value;
	}
	return merged as OnboardingAnswers;
}

/** Reads the answers saved when onboarding finished; `null` when nothing is stored. */
export async function loadAnswers(): Promise<OnboardingAnswers | null> {
	const json = await SecureStore.getItemAsync(ANSWERS_KEY);
	if (!json) return null;
	return mergeStoredAnswers(JSON.parse(json));
}

/** Only the answer fields, without the store's actions. */
export function pickAnswers(answers: OnboardingAnswers): OnboardingAnswers {
	const data: Record<string, unknown> = {};
	for (const key of Object.keys(initialAnswers) as (keyof OnboardingAnswers)[]) {
		data[key] = answers[key];
	}
	return data as OnboardingAnswers;
}

/** Saves the answers and when they last changed (used to decide the sync direction). */
export async function saveAnswers(
	answers: OnboardingAnswers,
	updatedAt: string = new Date().toISOString(),
): Promise<void> {
	await SecureStore.setItemAsync(ANSWERS_KEY, JSON.stringify(pickAnswers(answers)));
	await SecureStore.setItemAsync(UPDATED_AT_KEY, updatedAt);
}

/** When the saved answers last changed on this device; `null` when unknown. */
export function loadAnswersUpdatedAt(): Promise<string | null> {
	return SecureStore.getItemAsync(UPDATED_AT_KEY);
}

export async function clearAnswers(): Promise<void> {
	await SecureStore.deleteItemAsync(ANSWERS_KEY);
	await SecureStore.deleteItemAsync(UPDATED_AT_KEY);
}
