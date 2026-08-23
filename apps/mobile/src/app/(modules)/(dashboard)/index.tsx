import {
	Calendar01Icon,
	CheckmarkCircle02Icon,
	CircleIcon,
	PlusSignIcon,
	TradeUpIcon,
	Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { router } from "expo-router";
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
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { NeonColors } from "@/constants/design-system";
import { useAuth } from "@/modules/auth";
import {
	AddTransactionModal,
	FinanceSummaryCard,
	formatCurrency,
	useMonthSummaryQuery,
	useTransactionsQuery,
} from "@/modules/finance";
import { useTodayQuery, useToggleItemMutation } from "@/modules/routines";
import { useTheme } from "@/providers/theme-provider";

export default function DashboardIndex() {
	const { user } = useAuth();
	const { colors } = useTheme();
	const [expenseModalVisible, setExpenseModalVisible] = useState(false);

	const { data: todayData, isLoading: routinesLoading, refetch: refetchRoutines } = useTodayQuery();
	const {
		data: financeSummary,
		isLoading: financeLoading,
		refetch: refetchFinance,
	} = useMonthSummaryQuery();
	const {
		data: recentTransactions,
		isLoading: txLoading,
		refetch: refetchTx,
	} = useTransactionsQuery({ limit: 3 });

	const toggleMutation = useToggleItemMutation();

	const refreshing = routinesLoading || financeLoading || txLoading;

	const handleRefresh = () => {
		refetchRoutines();
		refetchFinance();
		refetchTx();
	};

	// Calculate overall routine completion
	const routines = todayData?.routines ?? [];
	const totalItems = routines.reduce((sum, r) => sum + r.totalItems, 0);
	const completedItems = routines.reduce((sum, r) => sum + r.completedItems, 0);
	const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;

	const handleToggle = (routineId: string, itemId: string, currentlyCompleted: boolean) => {
		toggleMutation.mutate({
			routineId,
			itemId,
			completed: !currentlyCompleted,
		});
	};

	const displayName = user?.profile?.displayName || user?.username || "Commander";

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
							tintColor={NeonColors.accent.green}
						/>
					}
				>
					<View style={styles.viewContainer}>
						{/* Greeting & System Status */}
						<View className="mb-6">
							<Text className="text-[#888888] font-medium text-xs uppercase tracking-wider">
								Personal OS • Overview
							</Text>
							<Text className="text-white font-light text-3xl mt-1">
								Welcome, <Text className="font-semibold text-white">{displayName}</Text>
							</Text>
						</View>

						{/* Daily Routine Summary Card */}
						<Pressable
							onPress={() => router.push("/(modules)/(routines)" as never)}
							style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
							className="p-5 mb-5 rounded-3xl bg-[#15161A] border border-white/[0.08] shadow-lg"
						>
							<View className="flex-row items-center justify-between mb-3">
								<View className="flex-row items-center gap-2">
									<View className="w-8 h-8 rounded-lg bg-green-500/15 items-center justify-center">
										<Icon icon={Calendar01Icon} size={16} color={NeonColors.accent.green} />
									</View>
									<Text className="text-[#888888] font-semibold text-xs uppercase tracking-wider">
										Today's Routines
									</Text>
								</View>
								<View className="bg-green-500/15 px-2.5 py-1 rounded-full flex-row items-center gap-1">
									<Icon icon={TradeUpIcon} size={12} color={NeonColors.accent.green} />
									<Text className="text-green-400 text-[11px] font-bold">
										{completedItems}/{totalItems} Done
									</Text>
								</View>
							</View>

							<View className="flex-row items-baseline justify-between mb-3">
								<Text className="text-white text-4xl font-light">
									{completionRate}
									<Text className="text-2xl text-[#888888]">%</Text>
								</Text>
								<Text className="text-green-400 font-semibold text-xs">
									{totalItems === 0
										? "All routines complete"
										: completedItems === totalItems
											? "🎉 Perfect execution today!"
											: `${totalItems - completedItems} steps remaining`}
								</Text>
							</View>

							{/* Progress Bar */}
							<View className="h-2 w-full bg-[#0B0C10] rounded-full overflow-hidden mb-4">
								<View
									style={{
										width: `${completionRate}%`,
										backgroundColor: NeonColors.accent.green,
									}}
									className="h-full rounded-full"
								/>
							</View>

							{/* Interactive Top Checklist (First 3 active items) */}
							{routines.length > 0 && (
								<View className="pt-3 border-t border-white/[0.05] gap-2">
									{routines
										.flatMap((r) => r.items)
										.slice(0, 3)
										.map((item) => (
											<Pressable
												key={item.id}
												onPress={() => {
													const parentRoutine = routines.find((r) =>
														r.items.some((i) => i.id === item.id),
													);
													if (parentRoutine) {
														handleToggle(parentRoutine.id, item.id, item.completed);
													}
												}}
												className="flex-row items-center justify-between p-2.5 rounded-xl bg-[#0B0C10] border border-white/[0.03]"
											>
												<View className="flex-row items-center gap-2.5 flex-1">
													<Icon
														icon={item.completed ? CheckmarkCircle02Icon : CircleIcon}
														size={18}
														color={
															item.completed ? NeonColors.accent.green : NeonColors.text.secondary
														}
													/>
													<Text
														style={{
															color: item.completed ? "#666666" : "#FFFFFF",
															textDecorationLine: item.completed ? "line-through" : "none",
														}}
														className="text-xs font-medium flex-1"
														numberOfLines={1}
													>
														{item.name}
													</Text>
												</View>
												{item.targetTime && (
													<Text className="text-[#666666] text-[10px]">{item.targetTime}</Text>
												)}
											</Pressable>
										))}
								</View>
							)}
						</Pressable>

						{/* Quick Actions Row */}
						<View className="flex-row gap-3 mb-5">
							<Pressable
								onPress={() => setExpenseModalVisible(true)}
								style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
								className="flex-1 p-3.5 rounded-2xl bg-[#15161A] border border-white/[0.06] flex-row items-center gap-2.5"
							>
								<View className="w-8 h-8 rounded-xl bg-orange-500/15 items-center justify-center">
									<Icon icon={PlusSignIcon} size={16} color={NeonColors.accent.orange} />
								</View>
								<View>
									<Text className="text-white font-semibold text-xs">Log Expense</Text>
									<Text className="text-[#888888] text-[10px]">Add to ledger</Text>
								</View>
							</Pressable>

							<Pressable
								onPress={() => router.push("/(modules)/(routines)" as never)}
								style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
								className="flex-1 p-3.5 rounded-2xl bg-[#15161A] border border-white/[0.06] flex-row items-center gap-2.5"
							>
								<View className="w-8 h-8 rounded-xl bg-green-500/15 items-center justify-center">
									<Icon icon={Calendar01Icon} size={16} color={NeonColors.accent.green} />
								</View>
								<View>
									<Text className="text-white font-semibold text-xs">All Routines</Text>
									<Text className="text-[#888888] text-[10px]">View checklist</Text>
								</View>
							</Pressable>
						</View>

						{/* Finance Health Section */}
						<View className="mb-5">
							<View className="flex-row items-center justify-between mb-3">
								<Text className="text-white font-bold text-sm uppercase tracking-wider">
									Financial Health
								</Text>
								<Pressable onPress={() => router.push("/(modules)/(expenses)" as never)}>
									<Text className="text-orange-400 text-xs font-semibold">View Capital →</Text>
								</Pressable>
							</View>

							{financeLoading && !financeSummary ? (
								<View className="h-40 rounded-3xl bg-[#15161A] items-center justify-center">
									<ActivityIndicator color={NeonColors.accent.orange} />
								</View>
							) : (
								<FinanceSummaryCard summary={financeSummary} />
							)}
						</View>

						{/* Recent Transactions */}
						{recentTransactions && recentTransactions.length > 0 && (
							<View className="mb-4">
								<View className="flex-row items-center justify-between mb-3">
									<Text className="text-white font-bold text-sm uppercase tracking-wider">
										Latest Transactions
									</Text>
									<Pressable
										onPress={() => router.push("/(modules)/(expenses)/transactions" as never)}
									>
										<Text className="text-[#888888] text-xs">All logs →</Text>
									</Pressable>
								</View>

								{recentTransactions.map((tx) => (
									<View
										key={tx.id}
										className="flex-row items-center justify-between p-3.5 mb-2 rounded-2xl bg-[#15161A] border border-white/[0.04]"
									>
										<View className="flex-row items-center gap-3 flex-1">
											<View className="w-8 h-8 rounded-lg bg-orange-500/10 items-center justify-center">
												<Icon
													icon={Wallet01Icon}
													size={16}
													color={
														tx.type === "income"
															? NeonColors.accent.green
															: NeonColors.accent.orange
													}
												/>
											</View>
											<View className="flex-1 pr-2">
												<Text
													className="text-white font-medium text-xs capitalize"
													numberOfLines={1}
												>
													{tx.category ?? "Expense"}
												</Text>
												<Text className="text-[#666666] text-[10px] mt-0.5" numberOfLines={1}>
													{tx.note ?? tx.occurredOn}
												</Text>
											</View>
										</View>
										<Text
											style={{
												color:
													tx.type === "income" ? NeonColors.accent.green : NeonColors.text.primary,
											}}
											className="font-bold text-xs"
										>
											{tx.type === "income" ? "+" : "-"}
											{formatCurrency(tx.amountMinor, tx.currency)}
										</Text>
									</View>
								))}
							</View>
						)}
					</View>
				</ScrollView>
			</SafeAreaView>

			<AddTransactionModal
				visible={expenseModalVisible}
				onClose={() => setExpenseModalVisible(false)}
			/>
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
		paddingBottom: 40,
	},
	viewContainer: {
		paddingHorizontal: 16,
		paddingTop: 8,
	},
});
