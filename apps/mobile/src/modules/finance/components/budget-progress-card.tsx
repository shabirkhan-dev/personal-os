import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonColors } from "@/constants/design-system";
import type { CategorySummary } from "../types/finance.types";
import { formatCurrency } from "./transaction-card";

interface BudgetProgressCardProps {
	item: CategorySummary;
	currency?: string;
}

export function BudgetProgressCard({ item, currency = "INR" }: BudgetProgressCardProps) {
	const spentMinor = item.spent;
	const limitMinor = item.limit ?? 0;
	const hasLimit = limitMinor > 0;
	const ratio = hasLimit ? Math.min(spentMinor / limitMinor, 1.5) : 0;
	const percentage = hasLimit ? Math.round((spentMinor / limitMinor) * 100) : null;
	const isOverBudget = hasLimit && spentMinor > limitMinor;

	const progressColor = isOverBudget
		? NeonColors.accent.red
		: ratio > 0.8
			? NeonColors.accent.orange
			: NeonColors.accent.green;

	return (
		<View
			style={styles.container}
			className="p-4 mb-3 rounded-2xl bg-[#15161A] border border-white/[0.06]"
		>
			<View className="flex-row items-center justify-between mb-2">
				<View className="flex-row items-center gap-2">
					<Text className="text-white font-semibold text-base capitalize">{item.category}</Text>
					{isOverBudget && (
						<View className="flex-row items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded-full">
							<Icon icon={AlertCircleIcon} size={12} color={NeonColors.accent.red} />
							<Text className="text-red-400 text-[10px] font-bold">Over Limit</Text>
						</View>
					)}
				</View>
				<Text className="text-white font-bold text-sm">
					{formatCurrency(spentMinor, currency)}
					{hasLimit && (
						<Text className="text-[#888888] font-normal text-xs">
							{" "}
							/ {formatCurrency(limitMinor, currency)}
						</Text>
					)}
				</Text>
			</View>

			{hasLimit ? (
				<View className="mt-1">
					<View className="h-2 w-full bg-[#222222] rounded-full overflow-hidden">
						<View
							style={{
								width: `${Math.min(ratio * 100, 100)}%`,
								backgroundColor: progressColor,
							}}
							className="h-full rounded-full"
						/>
					</View>
					<View className="flex-row justify-between items-center mt-1.5">
						<Text className="text-[#666666] text-[11px]">{percentage}% spent</Text>
						<Text style={{ color: progressColor }} className="text-[11px] font-medium">
							{isOverBudget
								? `Exceeded by ${formatCurrency(spentMinor - limitMinor, currency)}`
								: `${formatCurrency(limitMinor - spentMinor, currency)} remaining`}
						</Text>
					</View>
				</View>
			) : (
				<Text className="text-[#666666] text-xs mt-1">No budget limit set</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#15161A",
	},
});
