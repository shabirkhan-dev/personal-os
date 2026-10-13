import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";

/** The main app; first launch goes through onboarding. */
export default function HomeLayout() {
	const { hydrated, completed, hydrate } = useOnboardingProgress();

	useEffect(() => {
		if (!hydrated) hydrate().catch(() => undefined);
	}, [hydrated, hydrate]);

	if (!hydrated) return null;
	if (!completed) return <Redirect href={onboardingRoutes.splash} />;

	return <Stack screenOptions={{ headerShown: false }} />;
}
