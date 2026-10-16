import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { usePoTheme } from "@/theme";
import { TRAINING_PHOTOS } from "../lib/photos";

/** A bundled training photo by name ("handstand"), or a dumbbell glyph. */
export function TrainingImage({
	photo,
	size,
	radius = 14,
	fill = false,
	style,
}: {
	photo: string | null | undefined;
	size: number;
	radius?: number;
	fill?: boolean;
	style?: StyleProp<ImageStyle>;
}) {
	const { colors } = usePoTheme();
	const source = photo ? TRAINING_PHOTOS[photo] : undefined;
	const box = [
		fill ? { alignSelf: "stretch" as const, height: size } : { width: size, height: size },
		{ borderRadius: radius, backgroundColor: colors.bgSubtle },
		style,
	];
	if (!source) {
		return (
			<View style={[styles.empty, box]}>
				<Icon name="Dumbbell" size={Math.min(26, size / 2)} color={colors.textTertiary} />
			</View>
		);
	}
	return <Image source={source} resizeMode="cover" style={box} accessibilityIgnoresInvertColors />;
}

const styles = StyleSheet.create({ empty: { alignItems: "center", justifyContent: "center" } });
