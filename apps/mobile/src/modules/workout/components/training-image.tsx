import { type ImageStyle, type StyleProp, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { usePoTheme } from "@/theme";

/**
 * The picture slot for a session or program: no stock photos ship with the app, so it's a tinted
 * tile with a dumbbell. (`photo` is kept on saved data from older versions; it's ignored.)
 */
export function TrainingImage({
	size,
	radius = 14,
	fill = false,
	style,
}: {
	photo?: string | null;
	size: number;
	radius?: number;
	fill?: boolean;
	style?: StyleProp<ImageStyle>;
}) {
	const { colors } = usePoTheme();
	const box = [
		fill ? { width: "100%" as const, height: size } : { width: size, height: size },
		{ borderRadius: radius, backgroundColor: colors.accentSubtle },
		style,
	];
	return (
		<View style={[styles.empty, box]}>
			<Icon
				name="Dumbbell"
				size={Math.min(fill ? 40 : 26, size / 2)}
				color={colors.accentDefault}
			/>
		</View>
	);
}

const styles = StyleSheet.create({ empty: { alignItems: "center", justifyContent: "center" } });
