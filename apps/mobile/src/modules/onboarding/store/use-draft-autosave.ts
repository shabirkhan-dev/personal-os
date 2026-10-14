import { usePathname } from "expo-router";
import { useEffect } from "react";
import { type OnboardingRoute, routeForPathname } from "../lib/flow";
import { saveDraft } from "./draft-storage";
import { useOnboardingProgress } from "./onboarding-progress";
import { useOnboardingStore } from "./onboarding-store";

const SAVE_DELAY_MS = 300;

let currentRoute: OnboardingRoute | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

function scheduleSave(): void {
	clearTimeout(timer);
	timer = setTimeout(() => {
		// Once onboarding is finished the saved answers take over; no draft to keep.
		if (useOnboardingProgress.getState().completed) return;
		saveDraft(useOnboardingStore.getState(), currentRoute).catch((error: unknown) =>
			console.warn("[onboarding] could not save progress", error),
		);
	}, SAVE_DELAY_MS);
}

/**
 * Saves the answers and the current step while onboarding runs, so closing the app mid-way
 * loses nothing and the next launch continues on the same step.
 */
export function useDraftAutosave(): void {
	const pathname = usePathname();

	useEffect(() => {
		const route = routeForPathname(pathname);
		if (!route) return;
		currentRoute = route;
		scheduleSave();
	}, [pathname]);

	useEffect(() => {
		const unsubscribe = useOnboardingStore.subscribe(scheduleSave);
		return () => {
			unsubscribe();
			clearTimeout(timer);
		};
	}, []);
}
