import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { usePoTheme } from "@/theme";

export type ToggleProps = {
	value: boolean;
	onChange: (value: boolean) => void;
	accessibilityLabel: string;
};

/** Kit v2 "Toggle": 44×26 track, on = status/success, 22px knob in text/on-accent. */
export function Toggle({ value, onChange, accessibilityLabel }: ToggleProps) {
	const { colors } = usePoTheme();
	const progress = useSharedValue(value ? 1 : 0);

	useEffect(() => {
		progress.value = withSpring(value ? 1 : 0, { damping: 18, stiffness: 260 });
	}, [value, progress]);

	const trackStyle = useAnimatedStyle(() => ({
		backgroundColor: interpolateColor(
			progress.value,
			[0, 1],
			[colors.borderStrong, colors.statusSuccess],
		),
	}));
	const knobStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: 2 + progress.value * 18 }],
	}));

	return (
		<Pressable
			accessibilityRole="switch"
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ checked: value }}
			hitSlop={8}
			onPress={() => onChange(!value)}
		>
			<Animated.View style={[styles.track, trackStyle]}>
				<Animated.View style={[styles.knob, { backgroundColor: colors.textOnAccent }, knobStyle]} />
			</Animated.View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	track: { width: 44, height: 26, borderRadius: 13, justifyContent: "center" },
	knob: { width: 22, height: 22, borderRadius: 11 },
});
