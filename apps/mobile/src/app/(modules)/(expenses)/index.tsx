import { PlusSignIcon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui/card";
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

export default function ExpensesIndex() {
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
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 60 }}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
				>
					<View className="px-4 pt-2">
						<View className="flex-row items-center justify-between mb-2">
							<View>
								<Text className="text-foreground text-3xl font-light tracking-tight">Capital</Text>
								<Text className="text-muted-foreground text-xs mt-1">
									Live cash flow & budget tracking.
								</Text>
							</View>
							<Pressable
								onPress={() => setModalVisible(true)}
								className="bg-amber-500/20 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 border border-amber-500/30 active:opacity-80"
							>
								<Icon icon={PlusSignIcon} size={16} className="text-amber-500" strokeWidth={2.5} />
								<Text className="text-amber-500 font-bold text-xs">Add</Text>
							</Pressable>
						</View>

						<FinanceTabs active="overview" />

						{/* Net Summary Card */}
						{summaryLoading && !summary ? (
							<Card className="h-44 items-center justify-center mb-5">
								<ActivityIndicator className="text-amber-500" />
							</Card>
						) : (
							<FinanceSummaryCard summary={summary} />
						)}

						{/* Category Spending Breakdown */}
						{summary && summary.categories.length > 0 ? (
							<View className="mb-5">
								<Text className="text-foreground font-bold text-sm uppercase tracking-wider mb-3">
									Monthly Budgets & Spend
								</Text>
								{summary.categories.map((cat) => (
									<BudgetProgressCard key={cat.category} item={cat} />
								))}
							</View>
						) : null}

						{/* Recent Transactions */}
						<View className="mb-4">
							<View className="flex-row items-center justify-between mb-3">
								<Text className="text-foreground font-bold text-sm uppercase tracking-wider">
									Recent Transactions
								</Text>
								<Text className="text-muted-foreground text-xs">Hold to delete</Text>
							</View>

							{txLoading && !transactions ? (
								<Card className="h-24 items-center justify-center">
									<ActivityIndicator className="text-amber-500" />
								</Card>
							) : transactions && transactions.length > 0 ? (
								transactions.map((tx) => (
									<TransactionCard key={tx.id} transaction={tx} onDelete={handleDelete} />
								))
							) : (
								<Card className="p-8 items-center justify-center">
									<Icon icon={ShoppingBag01Icon} size={32} className="text-muted-foreground" />
									<Text className="text-muted-foreground font-medium text-sm mt-2">
										No transactions recorded yet
									</Text>
								</Card>
							)}
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>

			<AddTransactionModal visible={modalVisible} onClose={() => setModalVisible(false)} />
		</View>
	);
}
