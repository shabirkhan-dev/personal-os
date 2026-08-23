import {
	CreditCardIcon,
	Restaurant01Icon,
	ShoppingBag01Icon,
	SmartPhone01Icon,
	TradeUpIcon,
	Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon, type IconProp } from "@/components/ui/icon";
import { NeonColors } from "@/constants/design-system";
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

export function formatCurrency(amountMinor: number, currency: string = "INR"): string {
	const amount = amountMinor / 100;
	const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₹";
	return `${symbol}${amount.toLocaleString("en-IN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

export function TransactionCard({ transaction, onDelete }: TransactionCardProps) {
	const isIncome = transaction.type === "income";
	const icon = getCategoryIcon(transaction.category);
	const iconColor = isIncome ? NeonColors.accent.green : NeonColors.accent.orange;

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
			style={({ pressed }) => [styles.container, { opacity: pressed ? 0.75 : 1 }]}
			className="flex-row items-center justify-between p-3.5 mb-2.5 rounded-2xl bg-[#15161A] border border-white/[0.06]"
		>
			<View className="flex-row items-center gap-3 flex-1">
				<View
					style={{ backgroundColor: `${iconColor}18` }}
					className="w-10 h-10 rounded-xl items-center justify-center"
				>
					<Icon icon={icon} size={20} color={iconColor} strokeWidth={2} />
				</View>
				<View className="flex-1 pr-2">
					<Text className="text-white font-semibold text-sm capitalize" numberOfLines={1}>
						{transaction.category ?? "Uncategorized"}
					</Text>
					<Text className="text-[#888888] text-xs mt-0.5" numberOfLines={1}>
						{transaction.note ? transaction.note : transaction.occurredOn}
					</Text>
				</View>
			</View>

			<View className="items-end">
				<Text
					style={{
						color: isIncome ? NeonColors.accent.green : NeonColors.text.primary,
					}}
					className="font-bold text-sm"
				>
					{isIncome ? "+" : "-"}
					{formatCurrency(transaction.amountMinor, transaction.currency)}
				</Text>
				<Text className="text-[#555555] text-[10px] mt-0.5">{transaction.occurredOn}</Text>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#15161A",
	},
});
