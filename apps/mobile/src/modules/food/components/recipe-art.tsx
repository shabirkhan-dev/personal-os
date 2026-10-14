import type { ColorTokens } from "@personal-os/tokens";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { usePoTheme } from "@/theme";
import type { Recipe } from "../lib/recipes";

type Look = { icon: IconName; tint: keyof ColorTokens; background: keyof ColorTokens };

/** Bundled recipes have no photos yet, so each gets a tinted panel with its meal glyph. */
function lookFor(recipe: Recipe): Look {
	switch (recipe.slots[0]) {
		case "breakfast":
			return { icon: "Sun", tint: "statusCaution", background: "statusCautionSubtle" };
		case "snack":
			return { icon: "Star", tint: "statusSuccess", background: "statusSuccessSubtle" };
		case "lunch":
			return { icon: "Food", tint: "statusCaution", background: "statusCautionSubtle" };
		default:
			return { icon: "Food", tint: "statusViolet", background: "statusVioletSubtle" };
	}
}

export type RecipeArtProps = {
	recipe: Recipe;
	height: number;
	radius: number;
	glyph?: number;
	style?: StyleProp<ViewStyle>;
};

export function RecipeArt({ recipe, height, radius, glyph = 40, style }: RecipeArtProps) {
	const { colors } = usePoTheme();
	const look = lookFor(recipe);
	return (
		<View
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[
				styles.art,
				{ height, borderRadius: radius, backgroundColor: colors[look.background] },
				style,
			]}
		>
			<Icon name={look.icon} size={glyph} color={colors[look.tint]} />
		</View>
	);
}

const styles = StyleSheet.create({
	art: { width: "100%", alignItems: "center", justifyContent: "center", overflow: "hidden" },
});
