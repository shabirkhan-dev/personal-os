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
import { NeonColors } from "@/constants/design-system";
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
	const { colors } = useTheme();
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
							tintColor={NeonColors.accent.orange}
						/>
					}
				>
					<View style={styles.viewContainer}>
						<View style={styles.viewHeader}>
							<Text style={styles.viewTitle}>Transactions</Text>
							<Text style={styles.viewSubtitle}>Complete history and ledger.</Text>
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
											isSelected && {
												backgroundColor:
													filter === "income"
														? NeonColors.accent.green
														: filter === "expense"
															? NeonColors.accent.orange
															: "#FFFFFF",
											},
										]}
										className="px-4 py-2 rounded-xl bg-[#15161A] border border-white/[0.06]"
									>
										<Text
											style={{
												color: isSelected ? "#000000" : "#888888",
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
								<View className="h-40 items-center justify-center">
									<ActivityIndicator color={NeonColors.accent.orange} />
								</View>
							) : transactions && transactions.length > 0 ? (
								transactions.map((item) => (
									<TransactionCard key={item.id} transaction={item} onDelete={handleDelete} />
								))
							) : (
								<View className="p-12 rounded-3xl bg-[#15161A] items-center justify-center border border-white/[0.04] mt-4">
									<Icon icon={ShoppingBag01Icon} size={36} color="#555555" />
									<Text className="text-[#888888] font-medium text-sm mt-3">
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
	viewHeader: {
		marginBottom: 16,
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
	filterPill: {
		borderRadius: 12,
	},
	logsList: {
		marginTop: 4,
	},
});
