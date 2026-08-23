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
							tintColor={colors.accent.orange}
						/>
					}
				>
					<View style={styles.viewContainer}>
						<View className="flex-row items-center justify-between mb-2">
							<View>
								<Text style={[styles.viewTitle, { color: colors.text.primary }]}>Capital</Text>
								<Text style={[styles.viewSubtitle, { color: colors.text.secondary }]}>
									Live cash flow & budget tracking.
								</Text>
							</View>
							<Pressable
								onPress={() => setModalVisible(true)}
								style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
								className="bg-orange-500/20 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 border border-orange-500/30"
							>
								<Icon
									icon={PlusSignIcon}
									size={16}
									color={colors.accent.orange}
									strokeWidth={2.5}
								/>
								<Text style={{ color: colors.accent.orange }} className="font-bold text-xs">
									Add
								</Text>
							</Pressable>
						</View>

						<FinanceTabs active="overview" />

						{/* Net Summary Card */}
						{summaryLoading && !summary ? (
							<View
								style={{
									backgroundColor: colors.surface,
									borderColor: colors.card.border,
								}}
								className="h-44 rounded-3xl border items-center justify-center mb-5"
							>
								<ActivityIndicator color={colors.accent.orange} />
							</View>
						) : (
							<FinanceSummaryCard summary={summary} />
						)}

						{/* Category Spending Breakdown */}
						{summary && summary.categories.length > 0 && (
							<View className="mb-5">
								<Text
									style={{ color: colors.text.primary }}
									className="font-bold text-sm uppercase tracking-wider mb-3"
								>
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
								<Text
									style={{ color: colors.text.primary }}
									className="font-bold text-sm uppercase tracking-wider"
								>
									Recent Transactions
								</Text>
								<Text style={{ color: colors.text.secondary }} className="text-xs">
									Hold to delete
								</Text>
							</View>

							{txLoading && !transactions ? (
								<View
									style={{
										backgroundColor: colors.surface,
										borderColor: colors.card.border,
									}}
									className="h-24 rounded-2xl border items-center justify-center"
								>
									<ActivityIndicator color={colors.accent.orange} />
								</View>
							) : transactions && transactions.length > 0 ? (
								transactions.map((tx) => (
									<TransactionCard key={tx.id} transaction={tx} onDelete={handleDelete} />
								))
							) : (
								<View
									style={{
										backgroundColor: colors.surface,
										borderColor: colors.card.border,
									}}
									className="p-8 rounded-2xl items-center justify-center border"
								>
									<Icon icon={ShoppingBag01Icon} size={32} color={colors.text.muted} />
									<Text
										style={{ color: colors.text.secondary }}
										className="font-medium text-sm mt-2"
									>
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
		fontSize: 32,
		fontWeight: "300",
	},
	viewSubtitle: {
		fontSize: 14,
		marginTop: 4,
	},
});
