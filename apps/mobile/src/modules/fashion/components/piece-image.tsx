import { swatches } from "@personal-os/tokens";
import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from "react-native";
import { photoSource } from "@/lib/photos/local-photo";
import { usePoTheme } from "@/theme";
import { Icon } from "@/components/icons";
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

/** A piece's photo: the person's own, or a tile in its colour when there's none. */
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
	// Older data may name a bundled photo ("catalog:…"); those no longer ship.
	const source = image && !image.startsWith("catalog:") ? { uri: photoSource(image) } : undefined;
	const box = [
		fill ? styles.fill : { width: size, height: size },
		{ borderRadius: radius, backgroundColor: colors.bgSubtle },
		style,
	];
	if (!source) {
		return (
			<View style={[box, styles.empty]}>
				<View style={[styles.dot, { backgroundColor: swatches[colour] }]}>
					<Icon
						name={category === "scent" ? "Drop" : category === "watch" ? "Clock" : "Shirt"}
						size={18}
						color={colors.textTertiary}
					/>
				</View>
			</View>
		);
	}
	return <Image source={source} style={box} resizeMode="cover" accessibilityIgnoresInvertColors />;
}

/** The colour dot beside a piece's name. */
export function Swatch({ colour, size = 10 }: { colour: Colour; size?: number }) {
	return (
		<View
			style={{
				width: size,
				height: size,
				borderRadius: size / 2,
				backgroundColor: swatches[colour],
			}}
		/>
	);
}

const styles = StyleSheet.create({
	fill: { width: "100%", aspectRatio: 1 },
	empty: { alignItems: "center", justifyContent: "center" },
	dot: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		opacity: 0.85,
	},
});
