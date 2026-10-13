import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Icon } from "@/components/icons";
import { usePoTheme } from "@/theme";
import { type RichPart, RichText } from "./rich-text";

/** "AI insight" row: violet sparkle tile and a computed, partly emphasised sentence. */
export function AiInsight({ parts }: { parts: readonly RichPart[] }) {
	const { colors } = usePoTheme();

	return (
		<Animated.View
			entering={FadeIn.duration(300)}
			accessibilityLiveRegion="polite"
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={[styles.tile, { backgroundColor: colors.statusVioletSubtle }]}>
				<Icon name="Filled/Sparkle" size={16} color={colors.statusViolet} />
			</View>
			<RichText variant="meta13" parts={parts} style={styles.text} />
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingLeft: 8,
		paddingRight: 16,
		paddingVertical: 8,
		borderRadius: 26,
		borderWidth: 1,
	},
	tile: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
	text: { flex: 1 },
});
