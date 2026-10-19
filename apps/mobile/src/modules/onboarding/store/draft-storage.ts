import * as SecureStore from "@/lib/secure-store";
import { isResumable, type OnboardingRoute, onboardingRoutes } from "../lib/flow";
import { mergeStoredAnswers, pickAnswers } from "./answers-storage";
import type { OnboardingAnswers } from "./onboarding-store";

const DRAFT_KEY = "personal-os.onboarding.draft";

export type OnboardingDraft = { answers: OnboardingAnswers; route: OnboardingRoute | null };

const knownRoutes = new Set<string>(Object.values(onboardingRoutes));

/** Rebuilds a draft from stored JSON; anything unrecognised falls back safely. */
export function parseDraft(raw: unknown): OnboardingDraft | null {
	if (typeof raw !== "object" || raw === null) return null;
	const { answers, route } = raw as { answers?: unknown; route?: unknown };
	const knownRoute =
		typeof route === "string" && knownRoutes.has(route) ? (route as OnboardingRoute) : null;
	return {
		answers: mergeStoredAnswers(answers),
		route: knownRoute && isResumable(knownRoute) ? knownRoute : null,
	};
}

/** The unfinished onboarding (answers so far and the step it was on), if any. */
export async function loadDraft(): Promise<OnboardingDraft | null> {
	const json = await SecureStore.getItemAsync(DRAFT_KEY);
	if (!json) return null;
	return parseDraft(JSON.parse(json));
}

export async function saveDraft(answers: OnboardingAnswers, route: OnboardingRoute | null) {
	await SecureStore.setItemAsync(
		DRAFT_KEY,
		JSON.stringify({ answers: pickAnswers(answers), route }),
	);
}

export async function clearDraft(): Promise<void> {
	await SecureStore.deleteItemAsync(DRAFT_KEY);
}
