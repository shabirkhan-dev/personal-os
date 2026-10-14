import { router } from "expo-router";
import { UpcomingPreview } from "@/modules/onboarding/components/previews/upcoming";
import { WelcomeFrame } from "@/modules/onboarding/components/welcome-frame";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";

/** 03 Welcome · Upcoming */
export default function WelcomeUpcomingScreen() {
	return (
		<WelcomeFrame
			step={1}
			tone="accentDefault"
			eyebrow="Upcoming"
			title="Your day, ready when you are"
			body={["Morning, afternoon or night, Personal OS ", ["shows what's next."]]}
			preview={<UpcomingPreview />}
			cta="Continue"
			onNext={() => router.push(onboardingRoutes.welcomeVoice)}
			onSkip={() => router.push(onboardingRoutes.chooseHow)}
		/>
	);
}
