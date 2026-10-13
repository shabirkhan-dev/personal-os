import type { ColorTokens } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { PillButton } from "@/components/ui/pill-button";
import { OnboardingScreen } from "./onboarding-screen";
import type { RichPart } from "./rich-text";
import { TextBlock } from "./text-block";
import { WelcomeTop } from "./top-bars";

export type WelcomeFrameProps = {
	step: number;
	tone: keyof ColorTokens;
	eyebrow: string;
	title: string;
	body: readonly RichPart[];
	preview: ReactNode;
	cta: string;
	showPlus?: boolean;
	onNext: () => void;
	onSkip: () => void;
};

/** Frames 02–05: dots + Skip, a 420px preview, the text block and one primary pill. */
export function WelcomeFrame({
	step,
	tone,
	eyebrow,
	title,
	body,
	preview,
	cta,
	showPlus,
	onNext,
	onSkip,
}: WelcomeFrameProps) {
	return (
		<OnboardingScreen
			glow={tone}
			footer={<PillButton label={cta} showPlus={showPlus} onPress={onNext} />}
		>
			<WelcomeTop step={step} onSkip={onSkip} />
			<View style={styles.preview}>{preview}</View>
			<TextBlock dot={tone} eyebrow={eyebrow} title={title} body={body} />
		</OnboardingScreen>
	);
}

const styles = StyleSheet.create({
	preview: { height: 420, justifyContent: "center" },
});
