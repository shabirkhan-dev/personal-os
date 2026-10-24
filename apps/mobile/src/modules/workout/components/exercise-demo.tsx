import { Image as RemoteImage } from "expo-image";
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
import { useGuide } from "../hooks/use-catalog";
import { DEMO_FRAMES } from "../lib/demo-frames";
import { TrainingImage } from "./training-image";

/** How long each position shows, and the fade between them. */
const HOLD_MS = 900;
const FADE_MS = 280;

/**
 * An exercise shown moving. Media the person added comes first (an animation plays on its own,
 * cached for the gym; a photo is shown still); otherwise the bundled start and end positions fade
 * back and forth like a short loop, or the Training photo. Reduced motion shows stills.
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
	const guide = useGuide(name);
	const remote = guide?.media?.animation ?? guide?.media?.image;
	const frames = guide?.demo ? DEMO_FRAMES[guide.demo] : [];
	const [first, second] = frames;
	const moving = !remote && second !== undefined && !reduceMotion;
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
	const box = [styles.box, { height, borderRadius: radius, backgroundColor: colors.bgSubtle }];
	const label = `${name} demonstration`;

	if (remote) {
		return (
			<View style={box} accessible accessibilityRole="image" accessibilityLabel={label}>
				<RemoteImage
					source={{ uri: remote }}
					contentFit="cover"
					autoplay={!reduceMotion}
					cachePolicy="disk"
					transition={150}
					style={StyleSheet.absoluteFill}
				/>
			</View>
		);
	}
	if (!first) return <TrainingImage photo={photo} size={height} fill radius={radius} />;
	return (
		<View style={box} accessible accessibilityRole="image" accessibilityLabel={label}>
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

/** A small still of the exercise for lists: its photo, demo start position, or Training photo. */
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
	const guide = useGuide(name);
	const style = {
		width: size,
		height: size,
		borderRadius: radius,
		backgroundColor: colors.bgSubtle,
	};
	const remote = guide?.media?.image ?? guide?.media?.animation;
	if (remote) {
		return (
			<RemoteImage
				source={{ uri: remote }}
				contentFit="cover"
				autoplay={false}
				cachePolicy="disk"
				style={style}
				accessibilityIgnoresInvertColors
			/>
		);
	}
	const first = guide?.demo ? DEMO_FRAMES[guide.demo][0] : undefined;
	if (!first) return <TrainingImage photo={photo} size={size} radius={radius} />;
	return <Image source={first} resizeMode="cover" style={style} accessibilityIgnoresInvertColors />;
}

const styles = StyleSheet.create({
	box: { width: "100%", overflow: "hidden" },
});
