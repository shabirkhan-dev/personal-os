import { router } from "expo-router";
import { HomesPreview } from "@/modules/onboarding/components/previews/homes";
import { WelcomeFrame } from "@/modules/onboarding/components/welcome-frame";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";

/** 05 Welcome · Your homes */
export default function WelcomeHomesScreen() {
	return (
		<WelcomeFrame
			step={3}
			tone="statusCaution"
			eyebrow="Make it yours"
			title="Every module gets its own home"
			body={["Its own numbers, its own actions and its own color. ", ["Pick the ones you need."]]}
			preview={<HomesPreview />}
			cta="Get started"
			showPlus
			onNext={() => router.push(onboardingRoutes.chooseHow)}
			onSkip={() => router.push(onboardingRoutes.chooseHow)}
		/>
	);
}
