import { PlusSignIcon, Target01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import {
	ActivityIndicator,
	Modal,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { NeonColors } from "@/constants/design-system";
import {
	BudgetProgressCard,
	FinanceTabs,
	getCurrentMonthString,
	useBudgetsQuery,
	useMonthSummaryQuery,
	useSetBudgetsMutation,
} from "@/modules/finance";

export default function BudgetScreen() {
	const currentMonth = getCurrentMonthString();
	const { data: summary, isLoading, refetch } = useMonthSummaryQuery(currentMonth);
	const { data: budgets, refetch: refetchBudgets } = useBudgetsQuery(currentMonth);
	const setBudgetsMutation = useSetBudgetsMutation();

	const [budgetModalVisible, setBudgetModalVisible] = useState(false);
	const [categoryName, setCategoryName] = useState("");
	const [limitAmount, setLimitAmount] = useState("");

	const handleSaveBudget = async () => {
		const parsedLimit = Number.parseFloat(limitAmount);
		if (!categoryName.trim() || Number.isNaN(parsedLimit) || parsedLimit < 0) return;

		const currentList = budgets ?? [];
		const filtered = currentList.filter(
			(b) => b.category.toLowerCase() !== categoryName.trim().toLowerCase(),
		);
		const updatedBudgets = [
			...filtered.map((b) => ({ category: b.category, limitMinor: b.limitMinor })),
			{ category: categoryName.trim().toLowerCase(), limitMinor: Math.round(parsedLimit * 100) },
		];

		try {
			await setBudgetsMutation.mutateAsync({
				month: currentMonth,
				input: { budgets: updatedBudgets },
			});
			setCategoryName("");
			setLimitAmount("");
			setBudgetModalVisible(false);
		} catch {
			// Handled by mutation
		}
	};

	return (
		<View style={styles.container}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
					refreshControl={
						<RefreshControl
							refreshing={isLoading}
							onRefresh={() => {
								refetch();
								refetchBudgets();
							}}
							tintColor={NeonColors.accent.orange}
						/>
					}
				>
					<View style={styles.viewContainer}>
						<View className="flex-row items-center justify-between mb-2">
							<View>
								<Text style={styles.viewTitle}>Budget</Text>
								<Text style={styles.viewSubtitle}>
									Spending limits & category caps ({currentMonth}).
								</Text>
							</View>
							<Pressable
								onPress={() => setBudgetModalVisible(true)}
								style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
								className="bg-orange-500/20 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 border border-orange-500/30"
							>
								<Icon
									icon={PlusSignIcon}
									size={16}
									color={NeonColors.accent.orange}
									strokeWidth={2.5}
								/>
								<Text className="text-orange-400 font-bold text-xs">Set Limit</Text>
							</Pressable>
						</View>

						<FinanceTabs active="budget" />

						<View style={styles.logsList}>
							{isLoading && !summary ? (
								<View className="h-40 items-center justify-center">
									<ActivityIndicator color={NeonColors.accent.orange} />
								</View>
							) : summary && summary.categories.length > 0 ? (
								summary.categories.map((item) => (
									<BudgetProgressCard key={item.category} item={item} />
								))
							) : (
								<View className="p-12 rounded-3xl bg-[#15161A] items-center justify-center border border-white/[0.04]">
									<Icon icon={Target01Icon} size={36} color="#555555" />
									<Text className="text-[#888888] font-medium text-sm mt-3 text-center">
										No budget categories tracked yet.{"\n"}Tap "Set Limit" to define a monthly cap.
									</Text>
								</View>
							)}
						</View>
					</View>
				</ScrollView>
				<BottomNav activeTab="finance" onAddPress={() => setBudgetModalVisible(true)} />
			</SafeAreaView>

			{/* Set Budget Modal */}
			<Modal
				visible={budgetModalVisible}
				animationType="slide"
				transparent
				onRequestClose={() => setBudgetModalVisible(false)}
			>
				<View style={styles.modalOverlay}>
					<View
						style={styles.modalContent}
						className="bg-[#15161A] rounded-3xl p-6 border border-white/[0.08] w-[90%]"
					>
						<Text className="text-white font-bold text-lg mb-4">Set Category Budget Limit</Text>

						<View className="mb-3">
							<Text className="text-[#888888] text-xs font-semibold uppercase mb-1">Category</Text>
							<TextInput
								value={categoryName}
								onChangeText={setCategoryName}
								placeholder="e.g. food, transport, shopping"
								placeholderTextColor="#555555"
								style={styles.modalInput}
								className="bg-[#0B0C10] text-white p-3 rounded-xl border border-white/[0.06] text-sm"
							/>
						</View>

						<View className="mb-5">
							<Text className="text-[#888888] text-xs font-semibold uppercase mb-1">
								Monthly Limit (₹ / $)
							</Text>
							<TextInput
								value={limitAmount}
								onChangeText={setLimitAmount}
								placeholder="e.g. 5000"
								placeholderTextColor="#555555"
								keyboardType="decimal-pad"
								style={styles.modalInput}
								className="bg-[#0B0C10] text-white p-3 rounded-xl border border-white/[0.06] text-sm font-bold"
							/>
						</View>

						<View className="flex-row gap-3">
							<Pressable
								onPress={() => setBudgetModalVisible(false)}
								className="flex-1 py-3.5 rounded-xl bg-[#222222] items-center justify-center"
							>
								<Text className="text-[#888888] font-bold text-sm">Cancel</Text>
							</Pressable>
							<Pressable
								onPress={handleSaveBudget}
								disabled={setBudgetsMutation.isPending || !categoryName.trim() || !limitAmount}
								style={{
									opacity:
										setBudgetsMutation.isPending || !categoryName.trim() || !limitAmount ? 0.5 : 1,
									backgroundColor: NeonColors.accent.orange,
								}}
								className="flex-1 py-3.5 rounded-xl items-center justify-center"
							>
								{setBudgetsMutation.isPending ? (
									<ActivityIndicator color="#000000" />
								) : (
									<Text className="text-black font-bold text-sm">Save Limit</Text>
								)}
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: NeonColors.background,
	},
	safeArea: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 60,
	},
	viewContainer: {
		paddingHorizontal: 16,
		paddingTop: 8,
	},
	viewTitle: {
		color: NeonColors.text.primary,
		fontSize: 32,
		fontWeight: "300",
	},
	viewSubtitle: {
		color: NeonColors.text.secondary,
		fontSize: 14,
		marginTop: 4,
	},
	logsList: {
		marginTop: 4,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.75)",
		alignItems: "center",
		justifyContent: "center",
	},
	modalContent: {
		backgroundColor: "#15161A",
	},
	modalInput: {
		backgroundColor: "#0B0C10",
	},
});
