import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";
import { useOnboardingProgress } from "@/modules/onboarding/store/onboarding-progress";

export const unstable_settings = {
	initialRouteName: "(dashboard)",
};

export default function ModulesLayout() {
	const { hydrated, completed, hydrate } = useOnboardingProgress();

	useEffect(() => {
		if (!hydrated) hydrate().catch(() => undefined);
	}, [hydrated, hydrate]);

	if (!hydrated) return null;
	if (!completed) return <Redirect href={onboardingRoutes.splash} />;

	return <Stack screenOptions={{ headerShown: false }} />;
}
