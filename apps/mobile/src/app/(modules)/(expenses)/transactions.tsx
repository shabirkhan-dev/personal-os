import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";
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
	FinanceTabs,
	TransactionCard,
	type TransactionType,
	useDeleteTransactionMutation,
	useTransactionsQuery,
} from "@/modules/finance";
import { useTheme } from "@/providers/theme-provider";

export default function TransactionsScreen() {
	const { colors, isDark } = useTheme();
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
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
					refreshControl={
						<RefreshControl
							refreshing={isLoading}
							onRefresh={refetch}
							tintColor={colors.accent.orange}
						/>
					}
				>
					<View style={styles.viewContainer}>
						<View style={styles.viewHeader}>
							<Text style={[styles.viewTitle, { color: colors.text.primary }]}>Transactions</Text>
							<Text style={[styles.viewSubtitle, { color: colors.text.secondary }]}>
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
										style={[
											styles.filterPill,
											{
												backgroundColor: isSelected
													? filter === "income"
														? colors.accent.green
														: filter === "expense"
															? colors.accent.orange
															: isDark
																? "#FFFFFF"
																: "#0F172A"
													: colors.surface,
												borderColor: colors.card.border,
											},
										]}
										className="px-4 py-2 rounded-xl border"
									>
										<Text
											style={{
												color: isSelected
													? isDark
														? "#000000"
														: "#FFFFFF"
													: colors.text.secondary,
												fontWeight: isSelected ? "700" : "500",
											}}
											className="text-xs uppercase"
										>
											{filter}
										</Text>
									</Pressable>
								);
							})}
						</View>

						{/* Transaction List */}
						<View style={styles.logsList}>
							{isLoading && !transactions ? (
								<View
									style={{
										backgroundColor: colors.surface,
										borderColor: colors.card.border,
									}}
									className="h-40 items-center justify-center rounded-2xl border"
								>
									<ActivityIndicator color={colors.accent.orange} />
								</View>
							) : transactions && transactions.length > 0 ? (
								transactions.map((item) => (
									<TransactionCard key={item.id} transaction={item} onDelete={handleDelete} />
								))
							) : (
								<View
									style={{
										backgroundColor: colors.surface,
										borderColor: colors.card.border,
									}}
									className="p-12 rounded-3xl items-center justify-center border mt-4"
								>
									<Icon icon={ShoppingBag01Icon} size={36} color={colors.text.muted} />
									<Text
										style={{ color: colors.text.secondary }}
										className="font-medium text-sm mt-3"
									>
										No {typeFilter !== "all" ? typeFilter : ""} transactions found
									</Text>
								</View>
							)}
						</View>
					</View>
				</ScrollView>
				<BottomNav
					tabs={FINANCE_TABS}
					activeTab="transactions"
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
	viewHeader: {
		marginBottom: 16,
	},
	viewTitle: {
		fontSize: 32,
		fontWeight: "300",
	},
	viewSubtitle: {
		fontSize: 14,
		marginTop: 4,
	},
	filterPill: {
		borderRadius: 12,
	},
	logsList: {
		marginTop: 4,
	},
});
