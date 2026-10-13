import { stroke } from "@personal-os/tokens";
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

/**
 * Selectable card. Selected = bg/surface with a 1.5px accent border and no tinted
 * fill; unselected keeps the 1px border/default hairline.
 */
export function SelectCard({
	selected,
	onPress,
	children,
	radius = 30,
	style,
	accessibilityLabel,
}: SelectCardProps) {
	const { colors } = usePoTheme();
	const progress = useSharedValue(selected ? 1 : 0);

	useEffect(() => {
		progress.value = withTiming(selected ? 1 : 0, { duration: 180 });
	}, [selected, progress]);

	const animatedStyle = useAnimatedStyle(() => ({
		borderColor: interpolateColor(
			progress.value,
			[0, 1],
			[colors.borderDefault, colors.accentDefault],
		),
		borderWidth: stroke.hairline + progress.value * (stroke.selected - stroke.hairline),
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
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderRadius: radius },
				animatedStyle,
				style,
			]}
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
