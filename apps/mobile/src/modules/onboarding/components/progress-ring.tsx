import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	Easing,
	useAnimatedProps,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ProgressRingProps = {
	size: number;
	stroke: number;
	/** 0..1 */
	value: number;
	label?: string;
};

/** Profile-completeness ring: bg/subtle track with an accent arc that fills in. */
export function ProgressRing({ size, stroke, value, label }: ProgressRingProps) {
	const { colors } = usePoTheme();
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const progress = useSharedValue(0);

	useEffect(() => {
		progress.value = withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) });
	}, [value, progress]);

	const arcProps = useAnimatedProps(() => ({
		strokeDashoffset: circumference * (1 - progress.value),
	}));

	return (
		<View style={{ width: size, height: size }}>
			<Svg width={size} height={size} style={styles.rotate}>
				<Circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={colors.bgSubtle}
					strokeWidth={stroke}
					fill="none"
				/>
				<AnimatedCircle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={colors.accentDefault}
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={`${circumference} ${circumference}`}
					fill="none"
					animatedProps={arcProps}
				/>
			</Svg>
			{label ? (
				<View style={StyleSheet.absoluteFill}>
					<View style={styles.center}>
						<PoText variant="eyebrow11">{label}</PoText>
					</View>
				</View>
			) : null}
		</View>
	);
}

/** Small accent arc that spins while something is being prepared. */
export function Spinner({ size = 14 }: { size?: number }) {
	const { colors } = usePoTheme();
	const rotation = useSharedValue(0);
	const stroke = 2;
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;

	useEffect(() => {
		rotation.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1);
	}, [rotation]);

	const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

	return (
		<Animated.View style={[{ width: size, height: size }, style]} accessibilityLabel="Loading">
			<Svg width={size} height={size}>
				<Circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={colors.accentDefault}
					strokeWidth={stroke}
					strokeLinecap="round"
					strokeDasharray={`${circumference * 0.7} ${circumference}`}
					fill="none"
				/>
			</Svg>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	rotate: { transform: [{ rotate: "-90deg" }] },
	center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
