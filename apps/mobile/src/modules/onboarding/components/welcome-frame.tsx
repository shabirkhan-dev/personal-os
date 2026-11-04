import { router } from "expo-router";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { ColorTokens } from "@personal-os/tokens";
import { PillButton } from "@/components/ui/pill-button";
import { onboardingRoutes } from "../lib/flow";
import { OnboardingScreen } from "./onboarding-screen";
import type { RichPart } from "./rich-text";
import { TextBlock } from "./text-block";

export type WelcomeFrameProps = {
	tone: keyof ColorTokens;
	eyebrow: string;
	title: string;
	body: readonly RichPart[];
	preview: ReactNode;
	cta: string;
	showPlus?: boolean;
	onNext: () => void;
};

/**
 * The one welcome screen (Figma frames 02–05 folded into one): a 420px preview, the text block, the
 * primary pill and a way back in for an existing account.
 */
export function WelcomeFrame({
	tone,
	eyebrow,
	title,
	body,
	preview,
	cta,
	showPlus,
	onNext,
}: WelcomeFrameProps) {
	return (
		<OnboardingScreen
			glow={tone}
			footer={
				<>
					<PillButton label={cta} showPlus={showPlus} onPress={onNext} />
					<PillButton
						variant="ghost"
						label="I already have an account"
						onPress={() => router.push(onboardingRoutes.welcomeBack)}
					/>
				</>
			}
		>
			<View style={styles.preview}>{preview}</View>
			<TextBlock dot={tone} eyebrow={eyebrow} title={title} body={body} />
		</OnboardingScreen>
	);
}

const styles = StyleSheet.create({
	preview: { height: 420, marginTop: 40, justifyContent: "center" },
});
