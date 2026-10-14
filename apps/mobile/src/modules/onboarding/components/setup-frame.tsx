import { router } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { PillButton } from "@/components/ui/pill-button";
import { nextSetupRoute, type OnboardingRoute } from "../lib/flow";
import { goBack } from "../lib/navigation";
import { OnboardingScreen } from "./onboarding-screen";
import type { RichPart } from "./rich-text";
import { TextBlock } from "./text-block";
import { SETUP_STEPS, SetupTop } from "./top-bars";

export type SetupFrameProps = {
	step: number;
	route: OnboardingRoute;
	title: string;
	body: readonly RichPart[];
	children: ReactNode;
	/** Space between the text block and the form (24 on most steps, 18 on lists). */
	gap?: number;
	footer?: ReactNode;
	/** Runs before moving on (Continue and Skip). */
	onContinue?: () => void;
	/** False disables Continue until the step is answered; Skip still works. */
	canContinue?: boolean;
};

/** Frames 08–14: back, progress, Skip, "Step n of 8" heading, form, Continue. */
export function SetupFrame({
	step,
	route,
	title,
	body,
	children,
	gap = 24,
	footer,
	onContinue,
	canContinue = true,
}: SetupFrameProps) {
	const next = () => {
		onContinue?.();
		router.push(nextSetupRoute(route));
	};

	return (
		<OnboardingScreen
			scroll
			footer={footer ?? <PillButton label="Continue" disabled={!canContinue} onPress={next} />}
		>
			<SetupTop step={step} onBack={() => goBack(route)} actionLabel="Skip" onAction={next} />
			<View style={styles.gap24} />
			<TextBlock eyebrow={`Step ${step} of ${SETUP_STEPS}`} title={title} body={body} />
			<View style={{ height: gap }} />
			{children}
		</OnboardingScreen>
	);
}

const styles = StyleSheet.create({
	gap24: { height: 24 },
});
