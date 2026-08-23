import { PlusSignIcon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNav, FINANCE_TABS } from "@/components/ui/bottom-nav";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { NeonColors } from "@/constants/design-system";
import {
	AddTransactionModal,
	BudgetProgressCard,
	FinanceSummaryCard,
	FinanceTabs,
	TransactionCard,
	useDeleteTransactionMutation,
	useMonthSummaryQuery,
	useTransactionsQuery,
} from "@/modules/finance";
import { useTheme } from "@/providers/theme-provider";

export default function ExpensesIndex() {
	const { colors } = useTheme();
	const [modalVisible, setModalVisible] = useState(false);
	const {
		data: summary,
		isLoading: summaryLoading,
		refetch: refetchSummary,
	} = useMonthSummaryQuery();
	const {
		data: transactions,
		isLoading: txLoading,
		refetch: refetchTx,
	} = useTransactionsQuery({ limit: 5 });
	const deleteMutation = useDeleteTransactionMutation();

	const refreshing = summaryLoading || txLoading;

	const handleRefresh = () => {
		refetchSummary();
		refetchTx();
	};

	const handleDelete = (id: string) => {
		deleteMutation.mutate(id);
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={handleRefresh}
							tintColor={NeonColors.accent.orange}
						/>
					}
				>
					<View style={styles.viewContainer}>
						<View className="flex-row items-center justify-between mb-2">
							<View>
								<Text style={styles.viewTitle}>Capital</Text>
								<Text style={styles.viewSubtitle}>Live cash flow & budget tracking.</Text>
							</View>
							<Pressable
								onPress={() => setModalVisible(true)}
								style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
								className="bg-orange-500/20 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 border border-orange-500/30"
							>
								<Icon
									icon={PlusSignIcon}
									size={16}
									color={NeonColors.accent.orange}
									strokeWidth={2.5}
								/>
								<Text className="text-orange-400 font-bold text-xs">Add</Text>
							</Pressable>
						</View>

						<FinanceTabs active="overview" />

						{/* Net Summary Card */}
						{summaryLoading && !summary ? (
							<View className="h-44 rounded-3xl bg-[#15161A] items-center justify-center mb-5">
								<ActivityIndicator color={NeonColors.accent.orange} />
							</View>
						) : (
							<FinanceSummaryCard summary={summary} />
						)}

						{/* Category Spending Breakdown */}
						{summary && summary.categories.length > 0 && (
							<View className="mb-5">
								<Text className="text-white font-bold text-sm uppercase tracking-wider mb-3">
									Monthly Budgets & Spend
								</Text>
								{summary.categories.map((cat) => (
									<BudgetProgressCard key={cat.category} item={cat} />
								))}
							</View>
						)}

						{/* Recent Transactions */}
						<View className="mb-4">
							<View className="flex-row items-center justify-between mb-3">
								<Text className="text-white font-bold text-sm uppercase tracking-wider">
									Recent Transactions
								</Text>
								<Text className="text-[#888888] text-xs">Hold to delete</Text>
							</View>

							{txLoading && !transactions ? (
								<View className="h-24 rounded-2xl bg-[#15161A] items-center justify-center">
									<ActivityIndicator color={NeonColors.accent.orange} />
								</View>
							) : transactions && transactions.length > 0 ? (
								transactions.map((tx) => (
									<TransactionCard key={tx.id} transaction={tx} onDelete={handleDelete} />
								))
							) : (
								<View className="p-8 rounded-2xl bg-[#15161A] items-center justify-center border border-white/[0.04]">
									<Icon icon={ShoppingBag01Icon} size={32} color="#555555" />
									<Text className="text-[#888888] font-medium text-sm mt-2">
										No transactions recorded yet
									</Text>
								</View>
							)}
						</View>
					</View>
				</ScrollView>
				<BottomNav
					tabs={FINANCE_TABS}
					activeTab="capital"
					onAddPress={() => setModalVisible(true)}
				/>
			</SafeAreaView>

			<AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
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
});
