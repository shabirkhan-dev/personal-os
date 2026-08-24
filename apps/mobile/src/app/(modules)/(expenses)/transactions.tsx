import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { cn } from "@/lib/utils";
import {
	AddTransactionModal,
	FinanceTabs,
	TransactionCard,
	type TransactionType,
	useDeleteTransactionMutation,
	useTransactionsQuery,
} from "@/modules/finance";

export default function TransactionsScreen() {
	const [modalVisible, setModalVisible] = useState(false);
	const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");

	const {
		data: transactions,
		isLoading,
		refetch,
	} = useTransactionsQuery({
		type: typeFilter === "all" ? undefined : typeFilter,
		limit: 100,
	});

	const deleteMutation = useDeleteTransactionMutation();

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
					refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
				>
					<View className="px-4 pt-2">
						<View className="mb-4">
							<Text className="text-foreground text-3xl font-light tracking-tight">
								Transactions
							</Text>
							<Text className="text-muted-foreground text-xs mt-1">
								Complete history and ledger.
							</Text>
						</View>

						<FinanceTabs active="transactions" />

						{/* Type Filter Pills */}
						<View className="flex-row gap-2 mb-4">
							{(["all", "expense", "income"] as const).map((filter) => {
								const isSelected = typeFilter === filter;
								return (
									<Pressable
										key={filter}
										onPress={() => setTypeFilter(filter)}
										className={cn(
											"px-4 py-2 rounded-xl border active:opacity-80",
											isSelected
												? filter === "income"
													? "bg-emerald-500/20 border-emerald-500/40"
													: filter === "expense"
														? "bg-amber-500/20 border-amber-500/40"
														: "bg-card border-border shadow-sm"
												: "bg-muted/40 border-border/60",
										)}
									>
										<Text
											className={cn(
												"text-xs uppercase font-semibold",
												isSelected
													? filter === "income"
														? "text-emerald-500 font-bold"
														: filter === "expense"
															? "text-amber-500 font-bold"
															: "text-card-foreground font-bold"
													: "text-muted-foreground",
											)}
										>
											{filter}
										</Text>
									</Pressable>
								);
							})}
						</View>

						{/* Transaction List */}
						<View className="mt-1">
							{isLoading && !transactions ? (
								<Card className="h-40 items-center justify-center">
									<ActivityIndicator className="text-amber-500" />
								</Card>
							) : transactions && transactions.length > 0 ? (
								transactions.map((item) => (
									<TransactionCard key={item.id} transaction={item} onDelete={handleDelete} />
								))
							) : (
								<Card className="p-12 items-center justify-center mt-4">
									<Icon icon={ShoppingBag01Icon} size={36} className="text-muted-foreground" />
									<Text className="text-muted-foreground font-medium text-sm mt-3">
										No {typeFilter !== "all" ? typeFilter : ""} transactions found
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
