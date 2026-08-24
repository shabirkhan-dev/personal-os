import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Text, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
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

	const progressBg = isOverBudget
		? "bg-destructive"
		: ratio > 0.8
			? "bg-amber-500"
			: "bg-emerald-500";

	const progressTextColor = isOverBudget
		? "text-destructive"
		: ratio > 0.8
			? "text-amber-500"
			: "text-emerald-500";

	return (
		<Card className="p-4 mb-3">
			<View className="flex-row items-center justify-between mb-2">
				<View className="flex-row items-center gap-2">
					<Text className="text-card-foreground font-semibold text-base capitalize">
						{item.category}
					</Text>
					{isOverBudget ? (
						<Badge variant="destructive">
							<Icon icon={AlertCircleIcon} size={12} className="text-destructive" />
							<Text className="text-destructive text-[10px] font-bold">Over Limit</Text>
						</Badge>
					) : null}
				</View>
				<Text className="text-card-foreground font-bold text-sm">
					{formatCurrency(spentMinor, currency)}
					{hasLimit ? (
						<Text className="text-muted-foreground font-normal text-xs">
							{" "}
							/ {formatCurrency(limitMinor, currency)}
						</Text>
					) : null}
				</Text>
			</View>

			{hasLimit ? (
				<View className="mt-1">
					<View className="h-2 w-full bg-muted/80 rounded-full overflow-hidden">
						<View
							style={{ width: `${Math.min(ratio * 100, 100)}%` }}
							className={cn("h-full rounded-full", progressBg)}
						/>
					</View>
					<View className="flex-row justify-between items-center mt-1.5">
						<Text className="text-muted-foreground text-[11px]">{percentage}% spent</Text>
						<Text className={cn("text-[11px] font-medium", progressTextColor)}>
							{isOverBudget
								? `Exceeded by ${formatCurrency(spentMinor - limitMinor, currency)}`
								: `${formatCurrency(limitMinor - spentMinor, currency)} remaining`}
						</Text>
					</View>
				</View>
			) : (
				<Text className="text-muted-foreground text-xs mt-1">No budget limit set</Text>
			)}
		</Card>
	);
}
