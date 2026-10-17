import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { usePoTheme } from "@/theme";
import { WISHLIST_PHOTOS } from "../lib/wishlist-images";
import {
	CATEGORY_ICONS,
	CATEGORY_TILES,
	CATEGORY_TONES,
	type DreamCategory,
	type Photo,
} from "../lib/wishlist-model";

/** A dream's photo: the person's own, a bundled one, or the category glyph on its tint. */
export function DreamImage({
	photo,
	category,
	width,
	height,
	radius = 14,
	style,
}: {
	photo: Photo;
	category: DreamCategory;
	/** Omit to stretch to the parent's width. */
	width?: number;
	height: number;
	radius?: number;
	style?: StyleProp<ImageStyle>;
}) {
	const { colors } = usePoTheme();
	const source =
		photo?.kind === "file"
			? { uri: photo.uri }
			: photo?.kind === "bundled"
				? WISHLIST_PHOTOS[photo.key]
				: undefined;
	const box = [
		width === undefined ? styles.stretch : { width },
		{ height, borderRadius: radius, backgroundColor: colors[CATEGORY_TILES[category]] },
		style,
	];
	if (!source) {
		return (
			<View style={[styles.empty, box]} accessibilityElementsHidden>
				<Icon
					name={CATEGORY_ICONS[category]}
					size={Math.min(32, Math.max(18, height / 3))}
					color={colors[CATEGORY_TONES[category]]}
				/>
			</View>
		);
	}
	return <Image source={source} resizeMode="cover" style={box} accessibilityIgnoresInvertColors />;
}

const styles = StyleSheet.create({
	empty: { alignItems: "center", justifyContent: "center" },
	stretch: { alignSelf: "stretch" },
});
