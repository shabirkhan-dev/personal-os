import { useEffect } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { HeaderButton } from "@/components/ui/header-button";
import { usePoTheme } from "@/theme";
import { ChipButton } from "./chip-button";
import { StepDots } from "./step-dots";

export const SETUP_STEPS = 8;

/** Welcome header: pager dots on the left, Skip on the right. */
export function WelcomeTop({ step, onSkip }: { step: number; onSkip: () => void }) {
	return (
		<View style={[styles.bar, styles.welcome]}>
			<StepDots count={4} active={step} />
			<ChipButton label="Skip" onPress={onSkip} />
		</View>
	);
}

export type SetupTopProps = {
	onBack: () => void;
	/** 1-based step for the progress bar; omit to hide it. */
	step?: number;
	actionLabel?: string;
	onAction?: () => void;
};

/** Setup header: back button, optional progress bar, optional Skip-style chip. */
export function SetupTop({ onBack, step, actionLabel, onAction }: SetupTopProps) {
	return (
		<View style={[styles.bar, styles.setup]}>
			<HeaderButton icon="Filled/Back" accessibilityLabel="Back" onPress={onBack} />
			{step !== undefined ? (
				<ProgressBar value={step / SETUP_STEPS} />
			) : (
				<View style={styles.flex} />
			)}
			{actionLabel ? <ChipButton label={actionLabel} onPress={onAction} /> : null}
		</View>
	);
}

function ProgressBar({ value }: { value: number }) {
	const { colors } = usePoTheme();
	const trackWidth = useSharedValue(0);
	const progress = useSharedValue(Math.max(0, value - 1 / SETUP_STEPS));

	useEffect(() => {
		progress.value = withTiming(value, { duration: 420 });
	}, [value, progress]);

	const fillStyle = useAnimatedStyle(() => ({ width: trackWidth.value * progress.value }));
	const onLayout = (event: LayoutChangeEvent) => {
		trackWidth.value = event.nativeEvent.layout.width;
	};

	return (
		<View
			accessibilityRole="progressbar"
			accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
			onLayout={onLayout}
			style={[styles.track, { backgroundColor: colors.bgSubtle }]}
		>
			<Animated.View style={[styles.fill, { backgroundColor: colors.textPrimary }, fillStyle]} />
		</View>
	);
}

const styles = StyleSheet.create({
	bar: { height: 40, flexDirection: "row", alignItems: "center" },
	welcome: { justifyContent: "space-between", paddingLeft: 4 },
	setup: { gap: 14 },
	flex: { flex: 1 },
	track: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
	fill: { height: 4, borderRadius: 2 },
});
