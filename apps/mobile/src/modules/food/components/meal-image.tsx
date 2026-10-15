import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { usePoTheme } from "@/theme";
import { RECIPE_HEROES, RECIPE_IMAGES } from "../lib/recipe-images";

export type MealImageProps = {
	/** The person's own photo. */
	photo?: string | null;
	recipeId?: string | null;
	size: number;
	/** Stretch to the parent's width at `size` high. */
	fill?: boolean;
	/** Use the wide header crop when there is one. */
	hero?: boolean;
	radius?: number;
	style?: StyleProp<ImageStyle>;
};

/** A meal's picture: the photo taken, the recipe's photo, or a plain plate glyph. */
export function MealImage({
	photo,
	recipeId,
	size,
	fill = false,
	hero = false,
	radius = 14,
	style,
}: MealImageProps) {
	const { colors } = usePoTheme();
	const bundled = recipeId
		? ((hero ? RECIPE_HEROES[recipeId] : undefined) ?? RECIPE_IMAGES[recipeId])
		: undefined;
	const source = photo ? { uri: photo } : bundled;
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
