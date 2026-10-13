import * as SecureStore from "expo-secure-store";
import { initialAnswers, type OnboardingAnswers } from "./onboarding-store";

const ANSWERS_KEY = "personal-os.onboarding.answers";

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

export async function saveAnswers(answers: OnboardingAnswers): Promise<void> {
	const data: Record<string, unknown> = {};
	for (const key of Object.keys(initialAnswers) as (keyof OnboardingAnswers)[]) {
		data[key] = answers[key];
	}
	await SecureStore.setItemAsync(ANSWERS_KEY, JSON.stringify(data));
}

export async function clearAnswers(): Promise<void> {
	await SecureStore.deleteItemAsync(ANSWERS_KEY);
}
