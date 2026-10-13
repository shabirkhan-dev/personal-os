import { textStyles } from "@personal-os/tokens";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { toTextStyle, usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

export type PillButtonVariant = "primary" | "secondary" | "ghost";

export type PillButtonProps = {
	label: string;
	onPress?: () => void;
	variant?: PillButtonVariant;
	/** Shows the round plus badge after the label (Kit v2 "showPlus"). */
	showPlus?: boolean;
	disabled?: boolean;
	accessory?: ReactNode;
	style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const labelStyle = toTextStyle(textStyles.row15);

/** Kit v2 "Pill Button": 52px pill, radius 26. Primary is bg/inverse + text/inverse. */
export function PillButton({
	label,
	onPress,
	variant = "primary",
	showPlus = false,
	disabled = false,
	accessory,
	style,
}: PillButtonProps) {
	const { colors } = usePoTheme();
	const pressed = useSharedValue(0);
	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: 1 - pressed.value * 0.03 }],
	}));

	const background =
		variant === "primary"
			? colors.bgInverse
			: variant === "secondary"
				? colors.bgSubtle
				: "transparent";
	const textColor =
		variant === "primary"
			? colors.textInverse
			: variant === "secondary"
				? colors.textPrimary
				: colors.textSecondary;
	const plusBackground = variant === "primary" ? colors.textInverse : colors.bgInverse;
	const plusColor = variant === "primary" ? colors.bgInverse : colors.textInverse;

	return (
		<AnimatedPressable
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			disabled={disabled}
			onPress={
				onPress
					? () => {
							haptics.tap();
							onPress();
						}
					: undefined
			}
			onPressIn={() => {
				pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
			}}
			onPressOut={() => {
				pressed.value = withSpring(0, { damping: 20, stiffness: 400 });
			}}
			style={[
				styles.base,
				{ backgroundColor: background, opacity: disabled ? 0.4 : 1 },
				animatedStyle,
				style,
			]}
		>
			<Animated.Text allowFontScaling={false} style={[labelStyle, { color: textColor }]}>
				{label}
			</Animated.Text>
			{showPlus ? (
				<Animated.View style={[styles.plus, { backgroundColor: plusBackground }]}>
					<Icon name="Line/Plus" size={14} color={plusColor} />
				</Animated.View>
			) : null}
			{accessory}
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create({
	base: {
		height: 52,
		borderRadius: 26,
		paddingHorizontal: 24,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},
	plus: {
		width: 24,
		height: 24,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
});
