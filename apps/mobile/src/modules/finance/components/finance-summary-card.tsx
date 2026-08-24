import { TradeUpIcon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { Text, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
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
		<Card className="p-5 mb-5">
			<View className="flex-row items-center justify-between mb-3">
				<View className="flex-row items-center gap-2">
					<View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
						<Icon icon={Wallet01Icon} size={16} className="text-primary" />
					</View>
					<Text className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
						Net Flow ({summary?.month ?? "This Month"})
					</Text>
				</View>
				<Badge variant={isPositiveNet ? "success" : "destructive"}>
					<Icon
						icon={TradeUpIcon}
						size={12}
						className={isPositiveNet ? "text-emerald-500" : "text-destructive"}
					/>
					<Text
						className={
							isPositiveNet
								? "text-emerald-500 font-bold text-[11px]"
								: "text-destructive font-bold text-[11px]"
						}
					>
						{isPositiveNet ? "Surplus" : "Deficit"}
					</Text>
				</Badge>
			</View>

			{/* Large Net Number */}
			<Text className="text-foreground font-light text-4xl mb-5">
				{isPositiveNet ? "" : "-"}
				{formatCurrency(Math.abs(netTotal), currency)}
			</Text>

			{/* Income vs Expense Pills */}
			<View className="flex-row gap-3 pt-3 border-t border-border/40">
				<View className="flex-1 p-3.5 rounded-2xl bg-muted/40 border border-border/60">
					<Text className="text-muted-foreground text-[11px] font-semibold mb-0.5">
						Total Income
					</Text>
					<Text className="text-emerald-500 font-bold text-base">
						+{formatCurrency(incomeTotal, currency)}
					</Text>
				</View>
				<View className="flex-1 p-3.5 rounded-2xl bg-muted/40 border border-border/60">
					<Text className="text-muted-foreground text-[11px] font-semibold mb-0.5">
						Total Expense
					</Text>
					<Text className="text-amber-500 font-bold text-base">
						-{formatCurrency(expenseTotal, currency)}
					</Text>
				</View>
			</View>
		</Card>
	);
}
