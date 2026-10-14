import { elevation } from "@personal-os/tokens";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { toShadowStyle, usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";
import { moneySplit } from "../lib/finance-math";

export type FinanceMoneyCardProps = {
	/** "PKR · OCT" */
	period: string;
	/** Budget minus spent this month; null when no budget is set. */
	left: number | null;
	hidden: boolean;
	onToggleHidden: () => void;
	/** Opens the Set budget sheet. */
	onEditBudget: () => void;
};

/** Figma "Money card": the Finance tab and the dashed pocket with what is left to spend. */
export function FinanceMoneyCard({
	period,
	left,
	hidden,
	onToggleHidden,
	onEditBudget,
}: FinanceMoneyCardProps) {
	const { colors } = usePoTheme();
	const over = left !== null && left < 0;
	const parts = left === null ? null : moneySplit(Math.abs(left));

	return (
		<View
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
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={left === null ? "Set a monthly budget" : "Change monthly budget"}
				onPress={() => {
					haptics.tap();
					onEditBudget();
				}}
				style={[
					styles.pocket,
					{ backgroundColor: colors.bgSurface },
					toShadowStyle(elevation.pocket),
				]}
			>
				<View style={[styles.stitch, { borderColor: colors.borderDefault }]}>
					<PoText variant="meta13" tone={over ? "textDanger" : "textSecondary"}>
						{left === null
							? "Monthly budget"
							: over
								? "Over budget this month"
								: "Left to spend this month"}
					</PoText>
					{parts ? (
						<View style={styles.amount}>
							<View style={styles.number}>
								<PoText variant="row15" tone="textSecondary">
									{`${parts.symbol} `}
								</PoText>
								<PoText variant="hero40" numberOfLines={1}>
									{hidden ? "••••••" : parts.number}
								</PoText>
								{hidden ? null : (
									<PoText variant="hero40" tone="textTertiary">
										{parts.decimal}
									</PoText>
								)}
							</View>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel={hidden ? "Show amounts" : "Hide amounts"}
								hitSlop={12}
								onPress={() => {
									haptics.select();
									onToggleHidden();
								}}
								style={styles.eye}
							>
								<Icon name="Filled/Eye" color={colors.textPrimary} opacity={hidden ? 0.45 : 1} />
							</Pressable>
						</View>
					) : (
						<View style={styles.amount}>
							<PoText variant="hero40" tone="textTertiary">
								Not set
							</PoText>
							<PoText variant="meta13" tone="textLink" style={styles.hint}>
								Tap to set
							</PoText>
						</View>
					)}
				</View>
			</Pressable>
		</View>
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
	amount: { flexDirection: "row", alignItems: "center" },
	number: { flexDirection: "row", alignItems: "baseline", flexShrink: 1 },
	eye: { paddingLeft: 10 },
	hint: { marginLeft: 12 },
});
