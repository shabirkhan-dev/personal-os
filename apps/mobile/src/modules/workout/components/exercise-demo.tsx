import { Image as RemoteImage } from "expo-image";
import { StyleSheet, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { usePoTheme } from "@/theme";
import { useGuide } from "../hooks/use-catalog";
import { TrainingImage } from "./training-image";

/**
 * An exercise as the person added it: an animation plays on its own (cached for the gym), a photo
 * is shown still; without either, a plain tile. Reduced motion shows stills.
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
	return <TrainingImage photo={photo} size={height} fill radius={radius} />;
}

/** A small still of the exercise for lists: the person's photo or animation, or a plain tile. */
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
	return <TrainingImage photo={photo} size={size} radius={radius} />;
}

const styles = StyleSheet.create({
	box: { width: "100%", overflow: "hidden" },
});
