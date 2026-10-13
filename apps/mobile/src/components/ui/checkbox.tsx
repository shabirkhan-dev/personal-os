import { stroke } from "@personal-os/tokens";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { usePoTheme } from "@/theme";

export type CheckboxSize = 20 | 24 | 28;

export type CheckboxProps = {
	checked: boolean;
	size?: CheckboxSize;
};

const checkSize: Record<CheckboxSize, number> = { 20: 12, 24: 14, 28: 16 };

/**
 * Kit v2 "Checkbox". Checked = solid accent with a bold white check.
 * Unchecked = clear ring in text/tertiary. Sizes 20 / 24 / 28.
 */
export function Checkbox({ checked, size = 24 }: CheckboxProps) {
	const { colors } = usePoTheme();
	const progress = useSharedValue(checked ? 1 : 0);

	useEffect(() => {
		progress.value = withTiming(checked ? 1 : 0, { duration: 160 });
	}, [checked, progress]);

	const ringWidth = size === 20 ? stroke.selected : stroke.ring;

	const boxStyle = useAnimatedStyle(() => ({
		backgroundColor: interpolateColor(
			progress.value,
			[0, 1],
			[`${colors.accentDefault}00`, colors.accentDefault],
		),
		borderColor: interpolateColor(
			progress.value,
			[0, 1],
			[colors.textTertiary, colors.accentDefault],
		),
	}));

	const checkStyle = useAnimatedStyle(() => ({
		opacity: progress.value,
		transform: [{ scale: 0.5 + progress.value * 0.5 }],
	}));

	return (
		<Animated.View
			accessibilityRole="checkbox"
			accessibilityState={{ checked }}
			style={[
				styles.box,
				{ width: size, height: size, borderRadius: size / 2, borderWidth: ringWidth },
				boxStyle,
			]}
		>
			<Animated.View style={checkStyle}>
				<Icon name="Check bold" size={checkSize[size]} color={colors.textOnAccent} />
			</Animated.View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	box: {
		alignItems: "center",
		justifyContent: "center",
	},
});
