import { router } from "expo-router";
import { ModuleRowsPreview } from "@/modules/onboarding/components/previews/module-rows";
import { WelcomeFrame } from "@/modules/onboarding/components/welcome-frame";
import { onboardingRoutes } from "@/modules/onboarding/lib/flow";

/** Welcome: the one intro screen before setup. */
export default function WelcomeModulesScreen() {
	return (
		<WelcomeFrame
			tone="statusSuccess"
			eyebrow="Modules"
			title="One place for your whole life"
			body={["Money, training, food, faith and more. ", ["Type or say it, and it's done."]]}
			preview={<ModuleRowsPreview />}
			cta="Get started"
			showPlus
			onNext={() => router.push(onboardingRoutes.chooseHow)}
		/>
	);
}
