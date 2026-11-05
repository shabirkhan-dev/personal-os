import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from "react-native";
import { photoSource } from "@/lib/photos/local-photo";
import { Icon } from "@/components/icons";
import { usePoTheme } from "@/theme";
import { RECIPE_HEROES, RECIPE_IMAGES } from "../lib/recipe-images";
import { recipeById } from "../lib/recipes";

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

/** A meal's picture: the photo taken, the recipe's photo (bundled or the person's), or a plate glyph. */
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
	// The person's own recipes carry their own photo.
	const own = !photo && recipeId ? (recipeById(recipeId)?.image ?? null) : null;
	const picked = photo ?? own;
	const source = picked ? { uri: photoSource(picked) } : bundled;
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
