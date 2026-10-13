import { router } from "expo-router";
import { AiVoicePreview } from "@/modules/onboarding/components/previews/ai-voice";
import { WelcomeFrame } from "@/modules/onboarding/components/welcome-frame";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";

/** 04 Welcome · AI & voice */
export default function WelcomeVoiceScreen() {
	return (
		<WelcomeFrame
			step={2}
			tone="statusViolet"
			eyebrow="AI & voice"
			title="Just say it. It's done."
			body={[
				"Type, talk or scan. ",
				["AI answers and acts right away"],
				", even from the lock screen.",
			]}
			preview={<AiVoicePreview />}
			cta="Continue"
			onNext={() => router.push(onboardingRoutes.welcomeHomes)}
			onSkip={() => router.replace(onboardingRoutes.chooseHow)}
		/>
	);
}
