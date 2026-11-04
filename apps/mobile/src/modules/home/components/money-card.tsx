import { elevation } from "@personal-os/tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
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
 * budget. Until a budget exists it is one short row asking for one, not an empty pocket.
 * Tapping opens Finance.
 */
export function MoneyCard({ period, leftToSpend, hidden, onPress }: MoneyCardProps) {
	const { colors } = usePoTheme();
	const parts = leftToSpend === null ? null : moneyParts(leftToSpend);

	if (!parts) {
		return (
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Finance, set a monthly budget"
				onPress={onPress}
				style={({ pressed }) => [
					styles.setup,
					{
						backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
					},
				]}
			>
				<View style={[styles.dot, { backgroundColor: colors.statusSuccess }]} />
				<View style={styles.setupText}>
					<PoText variant="row15">Set a monthly budget</PoText>
					<PoText variant="meta13" tone="textSecondary">
						See what's left to spend, right here
					</PoText>
				</View>
				<Icon name="Line/Chevron right" size={16} color={colors.textSecondary} />
			</Pressable>
		);
	}

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={`Finance, ${hidden ? "amount hidden" : `${parts.whole} left this month`}`}
			onPress={onPress}
			style={[styles.card, { backgroundColor: colors.bgSurface }]}
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
				<View style={[styles.stitch, {}]}>
					<PoText variant="meta13" tone="textSecondary">
						Left to spend this month
					</PoText>
					<PoText variant="hero40" numberOfLines={1} adjustsFontSizeToFit>
						{hidden ? "••••••" : parts.whole}
						{hidden ? null : (
							<PoText variant="hero40" tone="textTertiary">
								{parts.decimal}
							</PoText>
						)}
					</PoText>
				</View>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: { height: 240, borderRadius: 20, overflow: "hidden" },
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
		borderRadius: 16,
	},
	label: { flexDirection: "row", alignItems: "center", gap: 8 },
	setup: {
		minHeight: 72,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		paddingHorizontal: 16,
		borderRadius: 20,
	},
	setupText: { flex: 1, gap: 2 },
	dot: { width: 8, height: 8, borderRadius: 4 },
	pocket: {
		position: "absolute",
		left: -1,
		right: -1,
		top: 63,
		height: 176,
		borderRadius: 20,
		padding: 12,
	},
	stitch: {
		flex: 1,
		justifyContent: "flex-end",
		gap: 4,
		paddingHorizontal: 18,
		paddingBottom: 20,
		borderRadius: 16,

		borderStyle: "dashed",
	},
});
