import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NeonCard } from "@/components/ui/neon-card";
import { NeonColors } from "@/constants/design-system";
import { formatCurrency, useMonthSummaryQuery } from "@/modules/finance";

export function SpendingWidget() {
	const { data: summary } = useMonthSummaryQuery();

	const totalExpenseMinor = summary?.expenseTotal ?? 19245;
	const totalIncomeMinor = summary?.incomeTotal ?? 250000;
	const spentPercentage =
		totalIncomeMinor > 0
			? Math.min(Math.round((totalExpenseMinor / totalIncomeMinor) * 100), 100)
			: 0;

	const colors = [
		NeonColors.accent.orange,
		NeonColors.accent.purple,
		NeonColors.accent.blue,
		NeonColors.accent.green,
		NeonColors.accent.teal,
	];

	const categories =
		summary && summary.categories.length > 0
			? summary.categories.slice(0, 4).map((c, idx) => ({
					name: c.category,
					amountMinor: c.spent,
					color: colors[idx % colors.length] ?? NeonColors.accent.orange,
				}))
			: [
					{ name: "Groceries", amountMinor: 7846, color: NeonColors.accent.orange },
					{ name: "Entertainment", amountMinor: 5620, color: NeonColors.accent.purple },
					{ name: "Transportation", amountMinor: 3358, color: NeonColors.accent.blue },
					{ name: "Utilities", amountMinor: 2421, color: NeonColors.accent.green },
				];

	return (
		<Pressable
			onPress={() => router.push("/(modules)/(expenses)" as never)}
			style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
		>
			<NeonCard>
				<Text style={styles.label}>MONTHLY SPENDING</Text>
				<View style={styles.amountContainer}>
					<Text style={styles.amount}>{formatCurrency(totalExpenseMinor)}</Text>
					<Text style={styles.percentage}>{spentPercentage}% of income</Text>
				</View>

				{/* Segmented Progress Bar */}
				<View style={styles.progressBar}>
					{[...Array(30)].map((_, i) => {
						let color = NeonColors.text.muted;
						if (i < 8) color = NeonColors.accent.orange;
						else if (i < 15) color = NeonColors.accent.purple;
						else if (i < 20) color = NeonColors.accent.blue;
						else if (i < 24) color = NeonColors.accent.green;

						return (
							<View
								key={`segment-${i}`}
								style={[styles.progressSegment, { backgroundColor: color }]}
							/>
						);
					})}
				</View>

				{/* Legend */}
				<View style={styles.legend}>
					{categories.map((cat) => (
						<View key={cat.name} style={styles.legendItem}>
							<View style={styles.legendLeft}>
								<View style={[styles.dot, { backgroundColor: cat.color }]} />
								<Text style={styles.categoryName} className="capitalize">
									{cat.name}
								</Text>
							</View>
							<Text style={styles.categoryAmount}>{formatCurrency(cat.amountMinor)}</Text>
						</View>
					))}
				</View>
			</NeonCard>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	label: {
		color: NeonColors.text.secondary,
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 2,
		marginBottom: 8,
	},
	amountContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "baseline",
		marginBottom: 20,
	},
	amount: {
		color: NeonColors.text.primary,
		fontSize: 42,
		fontWeight: "500",
	},
	decimal: {
		fontSize: 24,
		color: NeonColors.text.secondary,
	},
	percentage: {
		color: NeonColors.text.secondary,
		fontSize: 20,
		fontWeight: "400",
	},
	progressBar: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 24,
	},
	progressSegment: {
		width: 3,
		height: 14,
		borderRadius: 2,
	},
	legend: {
		gap: 12,
	},
	legendItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	legendLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	dot: {
		width: 3,
		height: 12,
		borderRadius: 2,
	},
	categoryName: {
		color: NeonColors.text.primary,
		fontSize: 14,
		fontWeight: "500",
	},
	categoryAmount: {
		color: NeonColors.text.secondary,
		fontSize: 14,
		fontWeight: "400",
		fontFamily: "monospace",
	},
});
