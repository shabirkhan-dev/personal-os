import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from "react-native";
import { photoSource } from "@/lib/photos/local-photo";
import { Icon } from "@/components/icons";
import { usePoTheme } from "@/theme";
import { recipeById } from "../lib/recipes";

export type MealImageProps = {
	/** The person's own photo. */
	photo?: string | null;
	recipeId?: string | null;
	size: number;
	/** Stretch to the parent's width at `size` high. */
	fill?: boolean;
	radius?: number;
	style?: StyleProp<ImageStyle>;
};

/** A meal's picture: the photo taken, the recipe's own photo, or a plate glyph. */
export function MealImage({
	photo,
	recipeId,
	size,
	fill = false,
	radius = 14,
	style,
}: MealImageProps) {
	const { colors } = usePoTheme();
	// A recipe carries its own photo, when the person added one.
	const own = !photo && recipeId ? (recipeById(recipeId)?.image ?? null) : null;
	const picked = photo ?? own;
	const source = picked ? { uri: photoSource(picked) } : null;
	const box = [
		fill ? { alignSelf: "stretch" as const, height: size } : { width: size, height: size },
		{ borderRadius: radius, backgroundColor: colors.bgSubtle },
		style,
	];
	if (!source) {
		return (
			<View style={[styles.empty, box]}>
				<Icon name="Food" size={Math.min(28, size / 2)} color={colors.textTertiary} />
			</View>
		);
	}
	return <Image source={source} resizeMode="cover" style={box} accessibilityIgnoresInvertColors />;
}

const styles = StyleSheet.create({
	empty: { alignItems: "center", justifyContent: "center" },
});
