import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";
import { RouteError } from "@/components/route-error";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";
import { useOnboardingSync } from "@/modules/onboarding/store/use-onboarding-sync";
import { useHeyOs } from "@/modules/home/hooks/use-hey-os";
import { useAvatarSync } from "@/modules/profile/hooks/use-avatar-sync";

/** Shown instead of a blank screen or a crash when a Home screen fails to render. */
export const ErrorBoundary = RouteError;

/** The main app; first launch goes through onboarding. */
export default function HomeLayout() {
	const { hydrated, completed, resumeRoute, hydrate } = useOnboardingProgress();
	useOnboardingSync();
	useAvatarSync();
	useHeyOs();

	useEffect(() => {
		if (!hydrated) {
			hydrate().catch((error: unknown) => console.warn("[onboarding] hydrate failed", error));
		}
	}, [hydrated, hydrate]);

	if (!hydrated) return null;
	if (!completed) return <Redirect href={resumeRoute ?? onboardingRoutes.splash} />;

	return <Stack screenOptions={{ headerShown: false }} />;
}
