import { router } from "expo-router";
import { ModuleRowsPreview } from "@/modules/onboarding/components/previews/module-rows";
import { WelcomeFrame } from "@/modules/onboarding/components/welcome-frame";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";

/** 02 Welcome · Modules */
export default function WelcomeModulesScreen() {
	return (
		<WelcomeFrame
			step={0}
			tone="statusSuccess"
			eyebrow="Modules"
			title="One place for your whole life"
			body={[
				"Routines, money, workouts, skincare, food and style. ",
				["Switch between them in one tap."],
			]}
			preview={<ModuleRowsPreview />}
			cta="Continue"
			onNext={() => router.push(onboardingRoutes.welcomeUpcoming)}
			onSkip={() => router.push(onboardingRoutes.chooseHow)}
		/>
	);
}
