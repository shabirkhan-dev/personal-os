import { Cancel01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/providers/theme-provider";
import { useCreateTransactionMutation } from "../hooks/use-finance-mutations";
import type { TransactionType } from "../types/finance.types";

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
	const { colors, isDark } = useTheme();
	const [type, setType] = useState<TransactionType>("expense");
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState("Food");
	const [customCategory, setCustomCategory] = useState("");
	const [note, setNote] = useState("");

	const createMutation = useCreateTransactionMutation();

	const handleSave = async () => {
		const parsedAmount = Number.parseFloat(amount);
		if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

		const finalCategory =
			category === "Other" && customCategory.trim() ? customCategory.trim() : category;
		const amountMinor = Math.round(parsedAmount * 100);

		try {
			await createMutation.mutateAsync({
				type,
				amountMinor,
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
				style={styles.overlay}
			>
				<View
					style={[
						styles.content,
						{
							backgroundColor: colors.surface,
							borderTopColor: colors.card.border,
						},
					]}
					className="rounded-t-3xl p-6 border-t"
				>
					<View className="flex-row items-center justify-between mb-5">
						<Text style={{ color: colors.text.primary }} className="font-bold text-lg">
							Add Transaction
						</Text>
						<Pressable onPress={onClose} hitSlop={12}>
							<Icon icon={Cancel01Icon} size={20} color={colors.text.secondary} />
						</Pressable>
					</View>

					{/* Type Switcher */}
					<View
						style={{
							backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
							borderColor: colors.card.border,
						}}
						className="flex-row p-1 rounded-xl mb-5 border"
					>
						<Pressable
							onPress={() => setType("expense")}
							style={[styles.typeButton, !isIncome && { backgroundColor: colors.accent.orange }]}
							className="flex-1 py-2.5 rounded-lg items-center justify-center"
						>
							<Text
								style={{ color: !isIncome ? "#000000" : colors.text.secondary }}
								className="font-bold text-xs"
							>
								Expense
							</Text>
						</Pressable>
						<Pressable
							onPress={() => setType("income")}
							style={[styles.typeButton, isIncome && { backgroundColor: colors.accent.green }]}
							className="flex-1 py-2.5 rounded-lg items-center justify-center"
						>
							<Text
								style={{ color: isIncome ? "#000000" : colors.text.secondary }}
								className="font-bold text-xs"
							>
								Income
							</Text>
						</Pressable>
					</View>

					{/* Amount Input */}
					<View className="mb-4">
						<Text
							style={{ color: colors.text.secondary }}
							className="text-xs font-semibold uppercase mb-1.5"
						>
							Amount (₹ / $)
						</Text>
						<TextInput
							value={amount}
							onChangeText={setAmount}
							placeholder="0.00"
							placeholderTextColor={colors.text.muted}
							keyboardType="decimal-pad"
							style={[
								styles.input,
								{
									backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
									borderColor: colors.card.border,
									color: colors.text.primary,
								},
							]}
							className="p-3.5 rounded-xl border text-xl font-bold"
						/>
					</View>

					{/* Category Selector */}
					<View className="mb-4">
						<Text
							style={{ color: colors.text.secondary }}
							className="text-xs font-semibold uppercase mb-2"
						>
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
										style={[
											styles.catBadge,
											{
												backgroundColor: isSelected
													? `${isIncome ? colors.accent.green : colors.accent.orange}18`
													: isDark
														? "rgba(255,255,255,0.03)"
														: "rgba(0,0,0,0.03)",
												borderColor: isSelected
													? isIncome
														? colors.accent.green
														: colors.accent.orange
													: colors.card.border,
											},
										]}
										className="px-3.5 py-2 rounded-xl border mr-2"
									>
										<Text
											style={{
												color: isSelected
													? isIncome
														? colors.accent.green
														: colors.accent.orange
													: colors.text.secondary,
												fontWeight: isSelected ? "700" : "500",
											}}
											className="text-xs"
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
							<Text
								style={{ color: colors.text.secondary }}
								className="text-xs font-semibold uppercase mb-1.5"
							>
								Custom Category
							</Text>
							<TextInput
								value={customCategory}
								onChangeText={setCustomCategory}
								placeholder="e.g. Freelance, Books, Gift"
								placeholderTextColor={colors.text.muted}
								style={[
									styles.input,
									{
										backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
										borderColor: colors.card.border,
										color: colors.text.primary,
									},
								]}
								className="p-3 rounded-xl border text-sm"
							/>
						</View>
					)}

					{/* Note Input */}
					<View className="mb-6">
						<Text
							style={{ color: colors.text.secondary }}
							className="text-xs font-semibold uppercase mb-1.5"
						>
							Note (Optional)
						</Text>
						<TextInput
							value={note}
							onChangeText={setNote}
							placeholder="e.g. Lunch with team, Groceries from supermarket"
							placeholderTextColor={colors.text.muted}
							style={[
								styles.input,
								{
									backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
									borderColor: colors.card.border,
									color: colors.text.primary,
								},
							]}
							className="p-3 rounded-xl border text-sm"
						/>
					</View>

					{/* Save Button */}
					<Pressable
						onPress={handleSave}
						disabled={createMutation.isPending || !amount}
						style={[
							styles.saveBtn,
							{
								backgroundColor: isIncome ? colors.accent.green : colors.accent.orange,
								opacity: createMutation.isPending || !amount ? 0.5 : 1,
							},
						]}
						className="py-4 rounded-xl items-center justify-center flex-row gap-2 shadow-lg"
					>
						{createMutation.isPending ? (
							<ActivityIndicator color="#000000" />
						) : (
							<>
								<Icon icon={PlusSignIcon} size={18} color="#000000" strokeWidth={2.5} />
								<Text className="text-black font-bold text-sm">Save Transaction</Text>
							</>
						)}
					</Pressable>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.75)",
		justifyContent: "flex-end",
	},
	content: {
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
	},
	typeButton: {
		borderRadius: 8,
	},
	input: {},
	catBadge: {},
	saveBtn: {
		borderRadius: 12,
	},
});
