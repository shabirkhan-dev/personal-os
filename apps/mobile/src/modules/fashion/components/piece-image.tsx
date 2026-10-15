import { swatches } from "@personal-os/tokens";
import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from "react-native";
import { usePoTheme } from "@/theme";
import { lookAlike } from "../lib/catalog";
import { CATALOG_IMAGES } from "../lib/catalog-images";
import type { Category, Colour } from "../lib/fashion-model";

export type PieceImageProps = {
	image: string | null;
	category: Category;
	colour: Colour;
	size: number;
	/** Stretch to the parent's width instead of a square of `size`. */
	fill?: boolean;
	radius?: number;
	style?: StyleProp<ImageStyle>;
};

/** A piece's photo: the person's own, a starter photo, or the closest look-alike. */
export function PieceImage({
	image,
	category,
	colour,
	size,
	fill = false,
	radius = 20,
	style,
}: PieceImageProps) {
	const { colors } = usePoTheme();
	const catalogId = image?.startsWith("catalog:")
		? image.slice("catalog:".length)
		: image
			? null
			: lookAlike(category, colour)?.id;
	const source = catalogId ? CATALOG_IMAGES[catalogId] : image ? { uri: image } : undefined;
	const box = [
		fill ? styles.fill : { width: size, height: size },
		{ borderRadius: radius, backgroundColor: colors.bgSubtle },
		style,
	];
	if (!source) return <View style={box} />;
	return <Image source={source} style={box} resizeMode="cover" accessibilityIgnoresInvertColors />;
}

/** The colour dot beside a piece's name. */
export function Swatch({ colour, size = 10 }: { colour: Colour; size?: number }) {
	const { colors } = usePoTheme();
	return (
		<View
			style={{
				width: size,
				height: size,
				borderRadius: size / 2,
				backgroundColor: swatches[colour],
				borderWidth: colour === "white" || colour === "black" ? StyleSheet.hairlineWidth : 0,
				borderColor: colors.borderStrong,
			}}
		/>
	);
}

const styles = StyleSheet.create({ fill: { width: "100%", aspectRatio: 1 } });
