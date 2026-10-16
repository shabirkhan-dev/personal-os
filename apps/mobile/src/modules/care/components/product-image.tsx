import { Image, type ImageStyle, type StyleProp, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { usePoTheme } from "@/theme";
import { CATALOG_IMAGES } from "../lib/catalog-images";

/** A product's photo: a bundled one ("catalog:cleanser"), the person's own, or a drop glyph. */
export function ProductImage({
	photo,
	size,
	radius = 14,
	fill = false,
	style,
}: {
	photo: string | null;
	size: number;
	radius?: number;
	fill?: boolean;
	style?: StyleProp<ImageStyle>;
}) {
	const { colors } = usePoTheme();
	const bundled = photo?.startsWith("catalog:")
		? CATALOG_IMAGES[photo.slice("catalog:".length)]
		: undefined;
	const source = bundled ?? (photo && !photo.startsWith("catalog:") ? { uri: photo } : undefined);
	const box = [
		fill ? { alignSelf: "stretch" as const, aspectRatio: 1 } : { width: size, height: size },
		{ borderRadius: radius, backgroundColor: colors.bgSubtle },
		style,
	];
	if (!source) {
		return (
			<View style={[styles.empty, box]}>
				<Icon name="Drop" size={Math.min(26, size / 2)} color={colors.textTertiary} />
			</View>
		);
	}
	return <Image source={source} resizeMode="cover" style={box} accessibilityIgnoresInvertColors />;
}

const styles = StyleSheet.create({ empty: { alignItems: "center", justifyContent: "center" } });
