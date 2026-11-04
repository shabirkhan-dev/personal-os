/**
 * Onboarding routes in flow order. Trimmed from the Figma Onboarding v5 frames (01–18): one welcome
 * instead of four and no Connect step (see DESIGN.md, "Onboarding").
 */
export const onboardingRoutes = {
	splash: "/(onboarding)/splash",
	welcomeModules: "/(onboarding)/welcome-modules",
	/** Sign in to an existing account and restore its plan (not a Figma frame). */
	welcomeBack: "/(onboarding)/welcome-back",
	chooseHow: "/(onboarding)/choose-how",
	voice: "/(onboarding)/voice",
	aboutYou: "/(onboarding)/about-you",
	body: "/(onboarding)/body",
	yourDay: "/(onboarding)/your-day",
	goals: "/(onboarding)/goals",
	modules: "/(onboarding)/modules",
	reminders: "/(onboarding)/reminders",
	building: "/(onboarding)/building",
	planReveal: "/(onboarding)/plan-reveal",
	signIn: "/(onboarding)/sign-in",
	allSet: "/(onboarding)/all-set",
} as const;

export type OnboardingRoute = (typeof onboardingRoutes)[keyof typeof onboardingRoutes];

/** Where Back goes when there is no screen to return to (after Skip, or after resuming). */
const previous: Partial<Record<OnboardingRoute, OnboardingRoute>> = {
	[onboardingRoutes.welcomeBack]: onboardingRoutes.welcomeModules,
	[onboardingRoutes.chooseHow]: onboardingRoutes.welcomeModules,
	[onboardingRoutes.voice]: onboardingRoutes.chooseHow,
	[onboardingRoutes.aboutYou]: onboardingRoutes.chooseHow,
	[onboardingRoutes.body]: onboardingRoutes.aboutYou,
	[onboardingRoutes.yourDay]: onboardingRoutes.body,
	[onboardingRoutes.goals]: onboardingRoutes.yourDay,
	[onboardingRoutes.modules]: onboardingRoutes.goals,
	[onboardingRoutes.reminders]: onboardingRoutes.modules,
	[onboardingRoutes.planReveal]: onboardingRoutes.reminders,
	[onboardingRoutes.signIn]: onboardingRoutes.planReveal,
	[onboardingRoutes.allSet]: onboardingRoutes.signIn,
};

export function previousRoute(current: OnboardingRoute): OnboardingRoute {
	return previous[current] ?? onboardingRoutes.chooseHow;
}

/** Steps worth resuming after the app is closed; the intro screens just play again. */
const resumable = new Set<OnboardingRoute>([
	onboardingRoutes.chooseHow,
	onboardingRoutes.voice,
	onboardingRoutes.aboutYou,
	onboardingRoutes.body,
	onboardingRoutes.yourDay,
	onboardingRoutes.goals,
	onboardingRoutes.modules,
	onboardingRoutes.reminders,
	onboardingRoutes.building,
	onboardingRoutes.planReveal,
	onboardingRoutes.signIn,
	onboardingRoutes.allSet,
]);

export function isResumable(route: OnboardingRoute): boolean {
	return resumable.has(route);
}

/** Maps a pathname such as "/goals" (groups are not part of it) to its onboarding route. */
export function routeForPathname(pathname: string): OnboardingRoute | null {
	const match = Object.values(onboardingRoutes).find(
		(route) => route.replace("/(onboarding)", "") === pathname,
	);
	return match ?? null;
}

/** "Step by step" questions; Skip and Continue both move to the next one. */
export const setupSequence: readonly OnboardingRoute[] = [
	onboardingRoutes.aboutYou,
	onboardingRoutes.body,
	onboardingRoutes.yourDay,
	onboardingRoutes.goals,
	onboardingRoutes.modules,
	onboardingRoutes.reminders,
	onboardingRoutes.building,
];

export function nextSetupRoute(current: OnboardingRoute): OnboardingRoute {
	const index = setupSequence.indexOf(current);
	return setupSequence[Math.min(setupSequence.length - 1, index + 1)] ?? onboardingRoutes.building;
}
