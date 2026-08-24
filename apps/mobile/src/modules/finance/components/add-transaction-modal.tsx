import { Cancel01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCreateTransactionMutation } from "../hooks/use-finance-mutations";
import type { TransactionType } from "../types/finance.types";
import { DEFAULT_CURRENCY } from "./transaction-card";

interface AddTransactionModalProps {
	visible: boolean;
	onClose: () => void;
}

const COMMON_CATEGORIES = [
	"Food",
	"Groceries",
	"Transport",
	"Bills",
	"Shopping",
	"Entertainment",
	"Health",
	"Salary",
	"Investment",
	"Other",
];

export function AddTransactionModal({ visible, onClose }: AddTransactionModalProps) {
	const [type, setType] = useState<TransactionType>("expense");
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState("Food");
	const [customCategory, setCustomCategory] = useState("");
	const [note, setNote] = useState("");

	const createMutation = useCreateTransactionMutation();

	const handleSave = async () => {
		const parsedAmount = Number.parseFloat(amount);
		if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

		const finalCategory =
			category === "Other" && customCategory.trim() ? customCategory.trim() : category;
		const amountMinor = Math.round(parsedAmount * 100);
		if (amountMinor < 1) return;

		try {
			await createMutation.mutateAsync({
				type,
				amountMinor,
				currency: DEFAULT_CURRENCY,
				category: finalCategory,
				note: note.trim() || undefined,
			});
			setAmount("");
			setNote("");
			setCustomCategory("");
			onClose();
		} catch {
			// Error handled by mutation
		}
	};

	const isIncome = type === "income";

	return (
		<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="flex-1 bg-black/70 justify-end"
			>
				<View className="bg-card rounded-t-3xl p-6 border-t border-border">
					<View className="flex-row items-center justify-between mb-5">
						<Text className="text-foreground font-bold text-lg">Add Transaction</Text>
						<Pressable onPress={onClose} hitSlop={12}>
							<Icon icon={Cancel01Icon} size={20} className="text-muted-foreground" />
						</Pressable>
					</View>

					{/* Type Switcher */}
					<View className="flex-row bg-muted/60 p-1 rounded-2xl mb-5 border border-border/40">
						<Pressable
							onPress={() => setType("expense")}
							className={cn(
								"flex-1 py-2.5 rounded-xl items-center justify-center",
								!isIncome && "bg-card border border-border/60 shadow-sm",
							)}
						>
							<Text
								className={cn(
									"font-bold text-xs",
									!isIncome ? "text-amber-500" : "text-muted-foreground",
								)}
							>
								Expense
							</Text>
						</Pressable>
						<Pressable
							onPress={() => setType("income")}
							className={cn(
								"flex-1 py-2.5 rounded-xl items-center justify-center",
								isIncome && "bg-card border border-border/60 shadow-sm",
							)}
						>
							<Text
								className={cn(
									"font-bold text-xs",
									isIncome ? "text-emerald-500" : "text-muted-foreground",
								)}
							>
								Income
							</Text>
						</Pressable>
					</View>

					{/* Amount Input */}
					<View className="mb-4">
						<Text className="text-muted-foreground text-xs font-semibold uppercase mb-1.5">
							Amount ({DEFAULT_CURRENCY})
						</Text>
						<Input
							value={amount}
							onChangeText={setAmount}
							placeholder="0.00"
							keyboardType="decimal-pad"
							className="text-xl font-bold"
						/>
					</View>

					{/* Category Selector */}
					<View className="mb-4">
						<Text className="text-muted-foreground text-xs font-semibold uppercase mb-2">
							Category
						</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							className="flex-row gap-2"
						>
							{COMMON_CATEGORIES.map((cat) => {
								const isSelected = category === cat;
								return (
									<Pressable
										key={cat}
										onPress={() => setCategory(cat)}
										className={cn(
											"px-3.5 py-2 rounded-xl border mr-2",
											isSelected
												? isIncome
													? "bg-emerald-500/15 border-emerald-500/40"
													: "bg-amber-500/15 border-amber-500/40"
												: "bg-muted/40 border-border",
										)}
									>
										<Text
											className={cn(
												"text-xs",
												isSelected
													? isIncome
														? "text-emerald-500 font-bold"
														: "text-amber-500 font-bold"
													: "text-muted-foreground font-medium",
											)}
										>
											{cat}
										</Text>
									</Pressable>
								);
							})}
						</ScrollView>
					</View>

					{category === "Other" && (
						<View className="mb-4">
							<Text className="text-muted-foreground text-xs font-semibold uppercase mb-1.5">
								Custom Category
							</Text>
							<Input
								value={customCategory}
								onChangeText={setCustomCategory}
								placeholder="e.g. Freelance, Books, Gift"
							/>
						</View>
					)}

					{/* Note Input */}
					<View className="mb-6">
						<Text className="text-muted-foreground text-xs font-semibold uppercase mb-1.5">
							Note (Optional)
						</Text>
						<Input
							value={note}
							onChangeText={setNote}
							placeholder="e.g. Lunch with team, Groceries from supermarket"
						/>
					</View>

					{/* Save Button */}
					<Button onPress={handleSave} disabled={!amount} loading={createMutation.isPending}>
						<Icon
							icon={PlusSignIcon}
							size={18}
							className="text-primary-foreground"
							strokeWidth={2.5}
						/>
						<Text className="text-primary-foreground font-bold text-sm">Save Transaction</Text>
					</Button>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}
