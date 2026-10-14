import { router } from "expo-router";
import { type OnboardingRoute, previousRoute } from "./flow";

/** Back, or the previous step when this screen was opened by Skip or by resuming. */
export function goBack(current: OnboardingRoute): void {
	if (router.canGoBack()) router.back();
	else router.replace(previousRoute(current));
}
