import { useEffect } from "react";
import { type DimensionValue, StyleSheet, View } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { usePoTheme } from "@/theme";

/** One placeholder bar or block. Shown only inside `SkeletonCard`, which owns the pulse. */
function Bar({ width, height }: { width: DimensionValue; height: number }) {
	const { colors } = usePoTheme();
	return (
		<View style={{ width, height, borderRadius: height / 2, backgroundColor: colors.bgHover }} />
	);
}

export type SkeletonCardProps = {
	/** Text lines under the title bar; the last is shorter, like a paragraph ending. */
	lines?: number;
	/** A square block on top for screens that lead with a photo (a dream, a piece). */
	media?: boolean;
	/** For screen readers: what is loading, "your list". */
	label?: string;
	/** Hidden from screen readers when a parent already announces the loading. */
	decorative?: boolean;
};

/**
 * A card-shaped placeholder that pulses softly while a screen's data loads, in place of a
 * spinner, so the layout doesn't jump when the real card arrives. Holds still with reduced motion.
 */
export function SkeletonCard({
	lines = 2,
	media = false,
	label = "content",
	decorative = false,
}: SkeletonCardProps) {
	const { colors } = usePoTheme();
	const pulse = useSharedValue(1);

	useEffect(() => {
		pulse.value = withRepeat(
			withTiming(0.55, {
				duration: 900,
				easing: Easing.inOut(Easing.quad),
				reduceMotion: ReduceMotion.System,
			}),
			-1,
			true,
			undefined,
			ReduceMotion.System,
		);
		return () => cancelAnimation(pulse);
	}, [pulse]);

	const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

	return (
		<Animated.View
			accessible={!decorative}
			accessibilityRole={decorative ? undefined : "progressbar"}
			accessibilityLabel={decorative ? undefined : `Loading ${label}`}
			importantForAccessibility={decorative ? "no-hide-descendants" : "auto"}
			accessibilityElementsHidden={decorative}
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
				style,
			]}
		>
			{media ? <View style={[styles.media, { backgroundColor: colors.bgHover }]} /> : null}
			<Bar width="45%" height={14} />
			{Array.from({ length: lines }, (_, index) => (
				<Bar key={index} width={index === lines - 1 ? "70%" : "100%"} height={10} />
			))}
		</Animated.View>
	);
}

/** A few cards stacked, for a list that is loading. */
export function SkeletonList({ count = 3, label = "content" }: { count?: number; label?: string }) {
	return (
		<View
			accessible
			accessibilityRole="progressbar"
			accessibilityLabel={`Loading ${label}`}
			style={styles.list}
		>
			{Array.from({ length: count }, (_, index) => (
				<SkeletonCard key={index} decorative />
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	card: { gap: 12, padding: 20, borderRadius: 28, borderWidth: 1 },
	media: { height: 180, borderRadius: 20, marginBottom: 4 },
	list: { gap: 12 },
});
