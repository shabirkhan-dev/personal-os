import { TradeUpIcon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/providers/theme-provider";
import type { MonthSummary } from "../types/finance.types";
import { formatCurrency } from "./transaction-card";

interface FinanceSummaryCardProps {
	summary?: MonthSummary;
	currency?: string;
}

export function FinanceSummaryCard({ summary, currency = "INR" }: FinanceSummaryCardProps) {
	const { colors, isDark } = useTheme();
	const incomeTotal = summary?.incomeTotal ?? 0;
	const expenseTotal = summary?.expenseTotal ?? 0;
	const netTotal = summary?.netTotal ?? 0;
	const isPositiveNet = netTotal >= 0;

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colors.surface,
					borderColor: colors.card.border,
				},
			]}
		>
			<View className="flex-row items-center justify-between mb-3">
				<View className="flex-row items-center gap-2">
					<View
						style={{
							backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
						}}
						className="w-8 h-8 rounded-lg items-center justify-center"
					>
						<Icon icon={Wallet01Icon} size={16} color={colors.text.primary} />
					</View>
					<Text
						style={{ color: colors.text.secondary }}
						className="font-semibold text-xs uppercase tracking-wider"
					>
						Net Flow ({summary?.month ?? "This Month"})
					</Text>
				</View>
				<View
					style={{
						backgroundColor: isPositiveNet ? "rgba(0, 230, 118, 0.15)" : "rgba(255, 109, 0, 0.15)",
					}}
					className="px-2.5 py-1 rounded-full flex-row items-center gap-1"
				>
					<Icon
						icon={TradeUpIcon}
						size={12}
						color={isPositiveNet ? colors.accent.green : colors.accent.orange}
					/>
					<Text
						style={{
							color: isPositiveNet ? colors.accent.green : colors.accent.orange,
						}}
						className="text-[11px] font-bold"
					>
						{isPositiveNet ? "Surplus" : "Deficit"}
					</Text>
				</View>
			</View>

			{/* Large Net Number */}
			<Text style={{ color: colors.text.primary }} className="font-light text-4xl mb-5">
				{isPositiveNet ? "" : "-"}
				{formatCurrency(Math.abs(netTotal), currency)}
			</Text>

			{/* Income vs Expense Pills */}
			<View style={{ borderTopColor: colors.card.border }} className="flex-row gap-3 pt-3 border-t">
				<View
					style={{
						backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
						borderColor: colors.card.border,
					}}
					className="flex-1 p-3 rounded-2xl border"
				>
					<Text style={{ color: colors.text.secondary }} className="text-[11px] font-medium mb-0.5">
						Total Income
					</Text>
					<Text style={{ color: colors.accent.green }} className="font-bold text-base">
						+{formatCurrency(incomeTotal, currency)}
					</Text>
				</View>
				<View
					style={{
						backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
						borderColor: colors.card.border,
					}}
					className="flex-1 p-3 rounded-2xl border"
				>
					<Text style={{ color: colors.text.secondary }} className="text-[11px] font-medium mb-0.5">
						Total Expense
					</Text>
					<Text style={{ color: colors.accent.orange }} className="font-bold text-base">
						-{formatCurrency(expenseTotal, currency)}
					</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 20,
		marginBottom: 20,
		borderRadius: 24,
		borderWidth: 1,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.05,
		shadowRadius: 12,
		elevation: 4,
	},
});
