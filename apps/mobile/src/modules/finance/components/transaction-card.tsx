import {
	CreditCardIcon,
	Restaurant01Icon,
	ShoppingBag01Icon,
	SmartPhone01Icon,
	TradeUpIcon,
	Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { Alert, Pressable, Text, View } from "react-native";
import { Icon, type IconProp } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { FinanceTransaction } from "../types/finance.types";

interface TransactionCardProps {
	transaction: FinanceTransaction;
	onDelete?: (id: string) => void;
}

function getCategoryIcon(category: string | null): IconProp {
	const cat = (category ?? "").toLowerCase();
	if (cat.includes("food") || cat.includes("grocer") || cat.includes("rest"))
		return Restaurant01Icon;
	if (cat.includes("shop") || cat.includes("cloth")) return ShoppingBag01Icon;
	if (cat.includes("bill") || cat.includes("phone") || cat.includes("util"))
		return SmartPhone01Icon;
	if (cat.includes("invest") || cat.includes("stock") || cat.includes("salary")) return TradeUpIcon;
	if (cat.includes("card")) return CreditCardIcon;
	return Wallet01Icon;
}

export const DEFAULT_CURRENCY = "INR";

export function formatCurrency(amountMinor: number, currency: string = DEFAULT_CURRENCY): string {
	try {
		return new Intl.NumberFormat("en-IN", {
			style: "currency",
			currency: currency.toUpperCase(),
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(amountMinor / 100);
	} catch {
		return `${currency.toUpperCase()} ${(amountMinor / 100).toFixed(2)}`;
	}
}

export function TransactionCard({ transaction, onDelete }: TransactionCardProps) {
	const isIncome = transaction.type === "income";
	const icon = getCategoryIcon(transaction.category);

	const handleLongPress = () => {
		if (!onDelete) return;
		Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Delete",
				style: "destructive",
				onPress: () => onDelete(transaction.id),
			},
		]);
	};

	return (
		<Pressable
			onLongPress={handleLongPress}
			className="flex-row items-center justify-between p-3.5 mb-2.5 rounded-2xl bg-card border border-border/80 shadow-sm shadow-black/5 active:opacity-75"
		>
			<View className="flex-row items-center gap-3 flex-1">
				<View
					className={cn(
						"w-10 h-10 rounded-xl items-center justify-center",
						isIncome ? "bg-emerald-500/15" : "bg-amber-500/15",
					)}
				>
					<Icon
						icon={icon}
						size={20}
						className={isIncome ? "text-emerald-500" : "text-amber-500"}
						strokeWidth={2}
					/>
				</View>
				<View className="flex-1 pr-2">
					<Text className="text-card-foreground font-semibold text-sm capitalize" numberOfLines={1}>
						{transaction.category ?? "Uncategorized"}
					</Text>
					<Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={1}>
						{transaction.note ? transaction.note : transaction.occurredOn}
					</Text>
				</View>
			</View>

			<View className="items-end">
				<Text
					className={cn(
						"font-bold text-sm",
						isIncome ? "text-emerald-500" : "text-card-foreground",
					)}
				>
					{isIncome ? "+" : "-"}
					{formatCurrency(transaction.amountMinor, transaction.currency)}
				</Text>
				<Text className="text-muted-foreground text-[10px] mt-0.5">{transaction.occurredOn}</Text>
			</View>
		</Pressable>
	);
}
