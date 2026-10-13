import { useEffect } from "react";
import { useAuth } from "@/modules/auth/context/auth-context";
import { syncDirection } from "../lib/sync";
import { onboardingService } from "../services/onboarding.service";
import { loadAnswersUpdatedAt, pickAnswers, saveAnswers } from "./answers-storage";
import { useOnboardingProgress } from "./onboarding-progress";
import { type OnboardingAnswers, useOnboardingStore } from "./onboarding-store";

const PUSH_DELAY_MS = 1_000;

/** Set while server answers are applied, so they are not pushed straight back. */
let applyingRemote = false;

async function push(token: string): Promise<void> {
	const answers = pickAnswers(useOnboardingStore.getState());
	const saved = await onboardingService.save(token, answers);
	await saveLocally(answers, saved.updatedAt);
}

/** The server copy is the one that matters; a failed local write is logged, not fatal. */
async function saveLocally(answers: OnboardingAnswers, updatedAt: string): Promise<void> {
	try {
		await saveAnswers(answers, updatedAt);
	} catch (error) {
		console.warn("[onboarding] could not save the synced answers on this device", error);
	}
}

async function reconcile(token: string): Promise<void> {
	const remote = await onboardingService.get(token);
	const localUpdatedAt = await loadAnswersUpdatedAt().catch((error: unknown) => {
		console.warn("[onboarding] could not read when the answers changed", error);
		return null;
	});
	const direction = syncDirection(localUpdatedAt, remote?.updatedAt ?? null);
	if (direction === "push") {
		await push(token);
	} else if (direction === "pull" && remote) {
		applyingRemote = true;
		try {
			useOnboardingStore.setState(remote.answers);
		} finally {
			applyingRemote = false;
		}
		await saveLocally(remote.answers, remote.updatedAt);
	}
}

/**
 * Keeps the onboarding answers in sync with the API while signed in: reconciles once per session
 * (newer side wins), then uploads local changes shortly after they happen.
 */
export function useOnboardingSync(): void {
	const { status, token } = useAuth();
	const completed = useOnboardingProgress((state) => state.completed);
	const active = status === "signed-in" && token !== null && completed;

	useEffect(() => {
		if (!active || !token) return;
		reconcile(token).catch((error: unknown) => console.warn("[onboarding] sync failed", error));

		let timer: ReturnType<typeof setTimeout> | undefined;
		const unsubscribe = useOnboardingStore.subscribe((state, previous) => {
			if (applyingRemote) return;
			const next = JSON.stringify(pickAnswers(state));
			if (next === JSON.stringify(pickAnswers(previous))) return;
			clearTimeout(timer);
			timer = setTimeout(() => {
				push(token).catch((error: unknown) =>
					console.warn("[onboarding] could not upload the answers", error),
				);
			}, PUSH_DELAY_MS);
		});
		return () => {
			unsubscribe();
			clearTimeout(timer);
		};
	}, [active, token]);
}
