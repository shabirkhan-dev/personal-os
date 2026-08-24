import { PlusSignIcon, Target01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import {
	ActivityIndicator,
	Modal,
	Pressable,
	RefreshControl,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNav, FINANCE_TABS } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { OSHeader } from "@/components/ui/os-header";
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
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 60 }}
					refreshControl={
						<RefreshControl
							refreshing={isLoading}
							onRefresh={() => {
								refetch();
								refetchBudgets();
							}}
						/>
					}
				>
					<View className="px-4 pt-2">
						<View className="flex-row items-center justify-between mb-2">
							<View>
								<Text className="text-foreground text-3xl font-light tracking-tight">Budget</Text>
								<Text className="text-muted-foreground text-xs mt-1">
									Spending limits & category caps ({currentMonth}).
								</Text>
							</View>
							<Pressable
								onPress={() => setBudgetModalVisible(true)}
								className="bg-amber-500/20 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 border border-amber-500/30 active:opacity-80"
							>
								<Icon icon={PlusSignIcon} size={16} className="text-amber-500" strokeWidth={2.5} />
								<Text className="text-amber-500 font-bold text-xs">Set Limit</Text>
							</Pressable>
						</View>

						<FinanceTabs active="budget" />

						<View className="mt-1">
							{isLoading && !summary ? (
								<Card className="h-40 items-center justify-center">
									<ActivityIndicator className="text-amber-500" />
								</Card>
							) : summary && summary.categories.length > 0 ? (
								summary.categories.map((item) => (
									<BudgetProgressCard key={item.category} item={item} />
								))
							) : (
								<Card className="p-12 items-center justify-center mt-4">
									<Icon icon={Target01Icon} size={36} className="text-muted-foreground" />
									<Text className="text-muted-foreground font-medium text-sm mt-3 text-center">
										No budget categories tracked yet.{"\n"}Tap "Set Limit" to define a monthly cap.
									</Text>
								</Card>
							)}
						</View>
					</View>
				</ScrollView>
				<BottomNav
					tabs={FINANCE_TABS}
					activeTab="budgets"
					onAddPress={() => setBudgetModalVisible(true)}
				/>
			</SafeAreaView>

			{/* Set Budget Modal */}
			<Modal
				visible={budgetModalVisible}
				animationType="slide"
				transparent
				onRequestClose={() => setBudgetModalVisible(false)}
			>
				<View className="flex-1 bg-black/70 justify-center items-center">
					<Card className="p-6 w-[90%] border-border">
						<Text className="text-foreground font-bold text-lg mb-4">
							Set Category Budget Limit
						</Text>

						<View className="mb-3">
							<Text className="text-muted-foreground text-xs font-semibold uppercase mb-1">
								Category
							</Text>
							<Input
								value={categoryName}
								onChangeText={setCategoryName}
								placeholder="e.g. food, transport, shopping"
							/>
						</View>

						<View className="mb-5">
							<Text className="text-muted-foreground text-xs font-semibold uppercase mb-1">
								Monthly Limit (₹ / $)
							</Text>
							<Input
								value={limitAmount}
								onChangeText={setLimitAmount}
								placeholder="e.g. 5000"
								keyboardType="decimal-pad"
								className="font-bold"
							/>
						</View>

						<View className="flex-row gap-3">
							<Button
								variant="outline"
								onPress={() => setBudgetModalVisible(false)}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button
								onPress={handleSaveBudget}
								disabled={!categoryName.trim() || !limitAmount}
								loading={setBudgetsMutation.isPending}
								className="flex-1 bg-amber-500 active:bg-amber-600"
							>
								Save Limit
							</Button>
						</View>
					</Card>
				</View>
			</Modal>
		</View>
	);
}
