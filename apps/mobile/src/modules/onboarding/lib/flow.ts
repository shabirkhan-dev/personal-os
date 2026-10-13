/** Onboarding v5 routes, in Figma frame order (01–18). */
export const onboardingRoutes = {
	splash: "/(onboarding)/splash",
	welcomeModules: "/(onboarding)/welcome-modules",
	welcomeUpcoming: "/(onboarding)/welcome-upcoming",
	welcomeVoice: "/(onboarding)/welcome-voice",
	welcomeHomes: "/(onboarding)/welcome-homes",
	chooseHow: "/(onboarding)/choose-how",
	voice: "/(onboarding)/voice",
	aboutYou: "/(onboarding)/about-you",
	body: "/(onboarding)/body",
	yourDay: "/(onboarding)/your-day",
	goals: "/(onboarding)/goals",
	modules: "/(onboarding)/modules",
	connect: "/(onboarding)/connect",
	reminders: "/(onboarding)/reminders",
	building: "/(onboarding)/building",
	planReveal: "/(onboarding)/plan-reveal",
	signIn: "/(onboarding)/sign-in",
	allSet: "/(onboarding)/all-set",
} as const;

export type OnboardingRoute = (typeof onboardingRoutes)[keyof typeof onboardingRoutes];

/** "Step by step" questions; Skip and Continue both move to the next one. */
export const setupSequence: readonly OnboardingRoute[] = [
	onboardingRoutes.aboutYou,
	onboardingRoutes.body,
	onboardingRoutes.yourDay,
	onboardingRoutes.goals,
	onboardingRoutes.modules,
	onboardingRoutes.connect,
	onboardingRoutes.reminders,
	onboardingRoutes.building,
];

export function nextSetupRoute(current: OnboardingRoute): OnboardingRoute {
	const index = setupSequence.indexOf(current);
	return setupSequence[Math.min(setupSequence.length - 1, index + 1)] ?? onboardingRoutes.building;
}
