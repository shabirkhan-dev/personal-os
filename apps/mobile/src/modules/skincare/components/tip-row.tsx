import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import type { TipPart } from "../lib/skin";

/** The sparkle tip row at the bottom of the Skincare Home. */
export function TipRow({ parts }: { parts: readonly TipPart[] }) {
	const { colors } = usePoTheme();
	return (
		<View
			style={[styles.row, { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault }]}
		>
			<View style={[styles.icon, { backgroundColor: colors.statusVioletSubtle }]}>
				<Icon name="Filled/Sparkle" size={16} color={colors.statusViolet} />
			</View>
			<PoText variant="meta13" tone="textSecondary" style={styles.text}>
				{parts.map((part) =>
					part.strong ? (
						<PoText key={part.text} variant="meta13" tone="textPrimary">
							{part.text}
						</PoText>
					) : (
						part.text
					),
				)}
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 8,
		paddingLeft: 8,
		paddingRight: 16,
		borderRadius: 28,
		borderWidth: 1,
	},
	icon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
	text: { flex: 1 },
});
