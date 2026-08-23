import { TradeUpIcon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonColors } from "@/constants/design-system";
import type { MonthSummary } from "../types/finance.types";
import { formatCurrency } from "./transaction-card";

interface FinanceSummaryCardProps {
	summary?: MonthSummary;
	currency?: string;
}

export function FinanceSummaryCard({ summary, currency = "INR" }: FinanceSummaryCardProps) {
	const incomeTotal = summary?.incomeTotal ?? 0;
	const expenseTotal = summary?.expenseTotal ?? 0;
	const netTotal = summary?.netTotal ?? 0;
	const isPositiveNet = netTotal >= 0;

	return (
		<View
			style={styles.container}
			className="p-5 mb-5 rounded-3xl bg-[#15161A] border border-white/[0.08] shadow-xl"
		>
			<View className="flex-row items-center justify-between mb-3">
				<View className="flex-row items-center gap-2">
					<View className="w-8 h-8 rounded-lg bg-white/10 items-center justify-center">
						<Icon icon={Wallet01Icon} size={16} color="#FFFFFF" />
					</View>
					<Text className="text-[#888888] font-semibold text-xs uppercase tracking-wider">
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
						color={isPositiveNet ? NeonColors.accent.green : NeonColors.accent.orange}
					/>
					<Text
						style={{
							color: isPositiveNet ? NeonColors.accent.green : NeonColors.accent.orange,
						}}
						className="text-[11px] font-bold"
					>
						{isPositiveNet ? "Surplus" : "Deficit"}
					</Text>
				</View>
			</View>

			{/* Large Net Number */}
			<Text className="text-white font-light text-4xl mb-5">
				{isPositiveNet ? "" : "-"}
				{formatCurrency(Math.abs(netTotal), currency)}
			</Text>

			{/* Income vs Expense Pills */}
			<View className="flex-row gap-3 pt-3 border-t border-white/[0.06]">
				<View className="flex-1 p-3 rounded-2xl bg-[#0B0C10] border border-white/[0.04]">
					<Text className="text-[#888888] text-[11px] font-medium mb-0.5">Total Income</Text>
					<Text style={{ color: NeonColors.accent.green }} className="font-bold text-base">
						+{formatCurrency(incomeTotal, currency)}
					</Text>
				</View>
				<View className="flex-1 p-3 rounded-2xl bg-[#0B0C10] border border-white/[0.04]">
					<Text className="text-[#888888] text-[11px] font-medium mb-0.5">Total Expense</Text>
					<Text style={{ color: NeonColors.accent.orange }} className="font-bold text-base">
						-{formatCurrency(expenseTotal, currency)}
					</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#15161A",
	},
});
