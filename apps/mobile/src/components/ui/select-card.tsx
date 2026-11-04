import { type ReactNode, useEffect } from "react";
import { Pressable, type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import Animated, {
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

export type SelectCardProps = {
	selected: boolean;
	onPress?: () => void;
	children: ReactNode;
	radius?: number;
	style?: StyleProp<ViewStyle>;
	accessibilityLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Selectable card: no outline; selected fills with the accent tint. */
export function SelectCard({
	selected,
	onPress,
	children,
	radius = 20,
	style,
	accessibilityLabel,
}: SelectCardProps) {
	const { colors } = usePoTheme();
	const progress = useSharedValue(selected ? 1 : 0);

	useEffect(() => {
		progress.value = withTiming(selected ? 1 : 0, { duration: 180 });
	}, [selected, progress]);

	const animatedStyle = useAnimatedStyle(() => ({
		backgroundColor: interpolateColor(
			progress.value,
			[0, 1],
			[colors.bgSurface, colors.accentSubtle],
		),
	}));

	return (
		<AnimatedPressable
			accessibilityRole="radio"
			accessibilityState={{ selected }}
			accessibilityLabel={accessibilityLabel}
			onPress={
				onPress
					? () => {
							haptics.select();
							onPress();
						}
					: undefined
			}
			style={[styles.card, { borderRadius: radius }, animatedStyle, style]}
		>
			{children}
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create({
	card: {
		overflow: "hidden",
	},
});
