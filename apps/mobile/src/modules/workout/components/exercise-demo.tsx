import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { usePoTheme } from "@/theme";
import { DEMO_FRAMES } from "../lib/demo-frames";
import { guideFor } from "../lib/exercise-guide";
import { TrainingImage } from "./training-image";

/** How long each position shows, and the fade between them. */
const HOLD_MS = 900;
const FADE_MS = 280;

/**
 * An exercise shown moving: its start and end positions fading back and forth, like a short loop.
 * A still when there is one frame or the system asks for reduced motion; the Training photo when the
 * exercise has no demo.
 */
export function ExerciseDemo({
	name,
	photo,
	height,
	radius = 28,
}: {
	name: string;
	photo: string;
	height: number;
	radius?: number;
}) {
	const { colors } = usePoTheme();
	const reduceMotion = useReducedMotion();
	const demo = guideFor(name)?.demo;
	const frames = demo ? DEMO_FRAMES[demo] : [];
	const [first, second] = frames;
	const moving = second !== undefined && !reduceMotion;
	const end = useSharedValue(0);

	useEffect(() => {
		if (!moving) {
			end.value = 0;
			return;
		}
		const fade = (to: number) =>
			withDelay(
				HOLD_MS,
				withTiming(to, {
					duration: FADE_MS,
					easing: Easing.inOut(Easing.quad),
					reduceMotion: ReduceMotion.System,
				}),
			);
		end.value = withRepeat(withSequence(fade(1), fade(0)), -1);
		return () => cancelAnimation(end);
	}, [moving, end]);

	const endStyle = useAnimatedStyle(() => ({ opacity: end.value }));

	if (!first) return <TrainingImage photo={photo} size={height} fill radius={radius} />;

	const box = [styles.box, { height, borderRadius: radius, backgroundColor: colors.bgSubtle }];
	return (
		<View
			style={box}
			accessible
			accessibilityRole="image"
			accessibilityLabel={`${name} demonstration`}
		>
			<Image source={first} resizeMode="cover" style={StyleSheet.absoluteFill} />
			{moving ? (
				<Animated.Image
					source={second}
					resizeMode="cover"
					style={[StyleSheet.absoluteFill, endStyle]}
				/>
			) : null}
		</View>
	);
}

/** A small still of the exercise for lists: its demo's start position, else the Training photo. */
export function ExerciseThumb({
	name,
	photo,
	size,
	radius = 12,
}: {
	name: string;
	photo: string;
	size: number;
	radius?: number;
}) {
	const { colors } = usePoTheme();
	const demo = guideFor(name)?.demo;
	const first = demo ? DEMO_FRAMES[demo][0] : undefined;
	if (!first) return <TrainingImage photo={photo} size={size} radius={radius} />;
	return (
		<Image
			source={first}
			resizeMode="cover"
			style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.bgSubtle }}
			accessibilityIgnoresInvertColors
		/>
	);
}

const styles = StyleSheet.create({
	box: { alignSelf: "stretch", overflow: "hidden" },
});
