import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/providers/theme-provider";
import type { CategorySummary } from "../types/finance.types";
import { formatCurrency } from "./transaction-card";

interface BudgetProgressCardProps {
	item: CategorySummary;
	currency?: string;
}

export function BudgetProgressCard({ item, currency = "INR" }: BudgetProgressCardProps) {
	const { colors, isDark } = useTheme();
	const spentMinor = item.spent;
	const limitMinor = item.limit ?? 0;
	const hasLimit = limitMinor > 0;
	const ratio = hasLimit ? Math.min(spentMinor / limitMinor, 1.5) : 0;
	const percentage = hasLimit ? Math.round((spentMinor / limitMinor) * 100) : null;
	const isOverBudget = hasLimit && spentMinor > limitMinor;

	const progressColor = isOverBudget
		? colors.accent.red
		: ratio > 0.8
			? colors.accent.orange
			: colors.accent.green;

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
			<View className="flex-row items-center justify-between mb-2">
				<View className="flex-row items-center gap-2">
					<Text
						style={{ color: colors.text.primary }}
						className="font-semibold text-base capitalize"
					>
						{item.category}
					</Text>
					{isOverBudget && (
						<View className="flex-row items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded-full">
							<Icon icon={AlertCircleIcon} size={12} color={colors.accent.red} />
							<Text className="text-red-400 text-[10px] font-bold">Over Limit</Text>
						</View>
					)}
				</View>
				<Text style={{ color: colors.text.primary }} className="font-bold text-sm">
					{formatCurrency(spentMinor, currency)}
					{hasLimit && (
						<Text style={{ color: colors.text.secondary }} className="font-normal text-xs">
							{" "}
							/ {formatCurrency(limitMinor, currency)}
						</Text>
					)}
				</Text>
			</View>

			{hasLimit ? (
				<View className="mt-1">
					<View
						style={{
							backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
						}}
						className="h-2 w-full rounded-full overflow-hidden"
					>
						<View
							style={{
								width: `${Math.min(ratio * 100, 100)}%`,
								backgroundColor: progressColor,
							}}
							className="h-full rounded-full"
						/>
					</View>
					<View className="flex-row justify-between items-center mt-1.5">
						<Text style={{ color: colors.text.muted }} className="text-[11px]">
							{percentage}% spent
						</Text>
						<Text style={{ color: progressColor }} className="text-[11px] font-medium">
							{isOverBudget
								? `Exceeded by ${formatCurrency(spentMinor - limitMinor, currency)}`
								: `${formatCurrency(limitMinor - spentMinor, currency)} remaining`}
						</Text>
					</View>
				</View>
			) : (
				<Text style={{ color: colors.text.muted }} className="text-xs mt-1">
					No budget limit set
				</Text>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		marginBottom: 12,
		borderRadius: 18,
		borderWidth: 1,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.04,
		shadowRadius: 8,
		elevation: 2,
	},
});
