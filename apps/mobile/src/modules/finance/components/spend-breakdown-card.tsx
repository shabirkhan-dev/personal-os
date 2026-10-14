import { Pressable, StyleSheet, View } from "react-native";
import { Card } from "@/components/ui/card";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { moneyParts } from "@/lib/money";
import { type CategoryTotal, spendTicks } from "../lib/finance-math";
import { CATEGORY_LABELS, CATEGORY_TONES } from "../lib/finance-model";

const TICKS = 32;

export type SpendBreakdownCardProps = {
	todayTotal: number;
	totals: readonly CategoryTotal[];
	/** Monthly budget ÷ days in month; null without a budget. */
	dailyBudget: number | null;
	onAddExpense: () => void;
	onSetBudget: () => void;
};

/** Figma "Widget / Spend Breakdown": today's spending by category against the daily budget. */
export function SpendBreakdownCard({
	todayTotal,
	totals,
	dailyBudget,
	onAddExpense,
	onSetBudget,
}: SpendBreakdownCardProps) {
	const { colors } = usePoTheme();
	const ticks = spendTicks(totals, dailyBudget, TICKS);
	const percent =
		dailyBudget !== null && dailyBudget > 0 ? Math.round((todayTotal / dailyBudget) * 100) : null;
	const { whole, decimal } = moneyParts(todayTotal);

	return (
		<Card style={styles.card}>
			<View style={styles.head}>
				<PoText variant="eyebrow11" tone="textTertiary">
					Today spending
				</PoText>
				<View style={styles.row}>
					<View style={styles.amount}>
						<PoText variant="hero40">{whole}</PoText>
						<PoText variant="title18" tone="textTertiary">
							{decimal}
						</PoText>
					</View>
					{percent !== null ? (
						<PoText
							variant="title18"
							tone={percent > 100 ? "textDanger" : "textTertiary"}
							accessibilityLabel={`${percent} percent of today's budget`}
						>
							{`${percent}%`}
						</PoText>
					) : (
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Set a monthly budget"
							hitSlop={8}
							onPress={onSetBudget}
						>
							<PoText variant="meta13" tone="textLink">
								No budget · Set
							</PoText>
						</Pressable>
					)}
				</View>
			</View>
			<View style={styles.ticks} accessible={false}>
				{ticks.map((category, index) => (
					<View
						key={index}
						style={[
							styles.tick,
							{
								backgroundColor: category ? colors[CATEGORY_TONES[category]] : colors.borderDefault,
							},
						]}
					/>
				))}
			</View>
			{totals.length > 0 ? (
				<View style={styles.legend}>
					{totals.map((item) => {
						const parts = moneyParts(item.amount);
						return (
							<View key={item.category} style={styles.legendRow}>
								<View
									style={[
										styles.swatch,
										{ backgroundColor: colors[CATEGORY_TONES[item.category]] },
									]}
								/>
								<PoText variant="mono13" style={styles.legendLabel}>
									{CATEGORY_LABELS[item.category]}
								</PoText>
								<View style={styles.legendAmount}>
									<PoText variant="mono13">{parts.whole}</PoText>
									<PoText variant="mono13" tone="textTertiary">
										{parts.decimal}
									</PoText>
								</View>
							</View>
						);
					})}
				</View>
			) : (
				<View style={styles.empty}>
					<PoText variant="mono13" tone="textSecondary">
						No spending today
					</PoText>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel="Add expense"
						hitSlop={8}
						onPress={onAddExpense}
					>
						<PoText variant="meta13" tone="textLink">
							Add expense
						</PoText>
					</Pressable>
				</View>
			)}
		</Card>
	);
}

const styles = StyleSheet.create({
	card: { gap: 18 },
	head: { gap: 10 },
	row: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
	amount: { flexDirection: "row", alignItems: "baseline", flexShrink: 1 },
	ticks: { flexDirection: "row", justifyContent: "space-between" },
	tick: { width: 4, height: 22, borderRadius: 2 },
	legend: { gap: 12, paddingTop: 4 },
	legendRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	swatch: { width: 4, height: 18, borderRadius: 2 },
	legendLabel: { flex: 1 },
	legendAmount: { flexDirection: "row" },
	empty: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: 4,
	},
});
