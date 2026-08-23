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
import { NeonColors } from "@/constants/design-system";
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
					style={styles.content}
					className="bg-[#15161A] rounded-t-3xl p-6 border-t border-white/[0.08]"
				>
					<View className="flex-row items-center justify-between mb-5">
						<Text className="text-white font-bold text-lg">Add Transaction</Text>
						<Pressable onPress={onClose} hitSlop={12}>
							<Icon icon={Cancel01Icon} size={20} color="#888888" />
						</Pressable>
					</View>

					{/* Type Switcher */}
					<View className="flex-row bg-[#0B0C10] p-1 rounded-xl mb-5 border border-white/[0.05]">
						<Pressable
							onPress={() => setType("expense")}
							style={[
								styles.typeButton,
								!isIncome && { backgroundColor: NeonColors.accent.orange },
							]}
							className="flex-1 py-2.5 rounded-lg items-center justify-center"
						>
							<Text
								style={{ color: !isIncome ? "#000000" : "#888888" }}
								className="font-bold text-xs"
							>
								Expense
							</Text>
						</Pressable>
						<Pressable
							onPress={() => setType("income")}
							style={[styles.typeButton, isIncome && { backgroundColor: NeonColors.accent.green }]}
							className="flex-1 py-2.5 rounded-lg items-center justify-center"
						>
							<Text
								style={{ color: isIncome ? "#000000" : "#888888" }}
								className="font-bold text-xs"
							>
								Income
							</Text>
						</Pressable>
					</View>

					{/* Amount Input */}
					<View className="mb-4">
						<Text className="text-[#888888] text-xs font-semibold uppercase mb-1.5">
							Amount (₹ / $)
						</Text>
						<TextInput
							value={amount}
							onChangeText={setAmount}
							placeholder="0.00"
							placeholderTextColor="#555555"
							keyboardType="decimal-pad"
							style={styles.input}
							className="bg-[#0B0C10] text-white p-3.5 rounded-xl border border-white/[0.06] text-xl font-bold"
						/>
					</View>

					{/* Category Selector */}
					<View className="mb-4">
						<Text className="text-[#888888] text-xs font-semibold uppercase mb-2">Category</Text>
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
											isSelected && {
												borderColor: isIncome ? NeonColors.accent.green : NeonColors.accent.orange,
												backgroundColor: `${isIncome ? NeonColors.accent.green : NeonColors.accent.orange}15`,
											},
										]}
										className="px-3.5 py-2 rounded-xl bg-[#0B0C10] border border-white/[0.06] mr-2"
									>
										<Text
											style={{
												color: isSelected
													? isIncome
														? NeonColors.accent.green
														: NeonColors.accent.orange
													: "#888888",
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
							<Text className="text-[#888888] text-xs font-semibold uppercase mb-1.5">
								Custom Category
							</Text>
							<TextInput
								value={customCategory}
								onChangeText={setCustomCategory}
								placeholder="e.g. Freelance, Books, Gift"
								placeholderTextColor="#555555"
								style={styles.input}
								className="bg-[#0B0C10] text-white p-3 rounded-xl border border-white/[0.06] text-sm"
							/>
						</View>
					)}

					{/* Note Input */}
					<View className="mb-6">
						<Text className="text-[#888888] text-xs font-semibold uppercase mb-1.5">
							Note (Optional)
						</Text>
						<TextInput
							value={note}
							onChangeText={setNote}
							placeholder="e.g. Lunch with team, Groceries from supermarket"
							placeholderTextColor="#555555"
							style={styles.input}
							className="bg-[#0B0C10] text-white p-3 rounded-xl border border-white/[0.06] text-sm"
						/>
					</View>

					{/* Save Button */}
					<Pressable
						onPress={handleSave}
						disabled={createMutation.isPending || !amount}
						style={[
							styles.saveBtn,
							{
								backgroundColor: isIncome ? NeonColors.accent.green : NeonColors.accent.orange,
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
		backgroundColor: "#15161A",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
	},
	typeButton: {
		borderRadius: 8,
	},
	input: {
		backgroundColor: "#0B0C10",
	},
	catBadge: {
		backgroundColor: "#0B0C10",
	},
	saveBtn: {
		borderRadius: 12,
	},
});
