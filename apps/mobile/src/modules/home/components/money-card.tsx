import { elevation } from "@personal-os/tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { PoText } from "@/components/ui/po-text";
import { moneyParts } from "@/lib/money";
import { toShadowStyle, usePoTheme } from "@/theme";

export type MoneyCardProps = {
	/** "PKR · OCT" */
	period: string;
	/** Budget left this month; `null` when no budget is set. */
	leftToSpend: number | null;
	hidden: boolean;
	onPress: () => void;
};

/**
 * Home "Money card": the Finance tab with the dashed pocket, showing what is left of this month's
 * budget, or "Not set" until a budget exists. Tapping opens Finance.
 */
export function MoneyCard({ period, leftToSpend, hidden, onPress }: MoneyCardProps) {
	const { colors } = usePoTheme();
	const parts = leftToSpend === null ? null : moneyParts(leftToSpend);

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={
				parts
					? `Finance, ${hidden ? "amount hidden" : `${parts.whole} left this month`}`
					: "Finance, set a monthly budget"
			}
			onPress={onPress}
			style={[
				styles.card,
				{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
			]}
		>
			<View style={[styles.tab, { backgroundColor: colors.bgSubtle }]}>
				<View style={styles.label}>
					<View style={[styles.dot, { backgroundColor: colors.statusSuccess }]} />
					<PoText variant="row15">Finance</PoText>
				</View>
				<PoText variant="mono13" tone="textTertiary">
					{period}
				</PoText>
			</View>
			<View
				style={[
					styles.pocket,
					{ backgroundColor: colors.bgSurface },
					toShadowStyle(elevation.pocket),
				]}
			>
				<View style={[styles.stitch, { borderColor: colors.borderDefault }]}>
					<PoText variant="meta13" tone="textSecondary">
						{parts ? "Left to spend this month" : "Monthly budget"}
					</PoText>
					{parts ? (
						<PoText variant="hero40" numberOfLines={1} adjustsFontSizeToFit>
							{hidden ? "••••••" : parts.whole}
							{hidden ? null : (
								<PoText variant="hero40" tone="textTertiary">
									{parts.decimal}
								</PoText>
							)}
						</PoText>
					) : (
						<PoText variant="hero40" tone="textTertiary">
							Not set
						</PoText>
					)}
				</View>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: { height: 240, borderRadius: 32, borderWidth: 1, overflow: "hidden" },
	tab: {
		position: "absolute",
		left: 13,
		right: 13,
		top: 13,
		height: 70,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		paddingTop: 16,
		paddingHorizontal: 18,
		borderRadius: 22,
	},
	label: { flexDirection: "row", alignItems: "center", gap: 8 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	pocket: {
		position: "absolute",
		left: -1,
		right: -1,
		top: 63,
		height: 176,
		borderRadius: 30,
		padding: 12,
	},
	stitch: {
		flex: 1,
		justifyContent: "flex-end",
		gap: 4,
		paddingHorizontal: 18,
		paddingBottom: 20,
		borderRadius: 22,
		borderWidth: 1.5,
		borderStyle: "dashed",
	},
});
