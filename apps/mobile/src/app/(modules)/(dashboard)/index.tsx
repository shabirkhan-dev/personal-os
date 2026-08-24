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
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { cn } from "@/lib/utils";
import { useAuth } from "@/modules/auth";
import {
	AddTransactionModal,
	FinanceSummaryCard,
	formatCurrency,
	useMonthSummaryQuery,
	useTransactionsQuery,
} from "@/modules/finance";
import { useTodayQuery, useToggleItemMutation } from "@/modules/routines";

export default function DashboardIndex() {
	const { user } = useAuth();
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
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 40 }}
					refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
				>
					<View className="px-4 pt-2">
						{/* Greeting & System Status */}
						<View className="mb-6">
							<Text className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
								Personal OS • Overview
							</Text>
							<Text className="text-foreground font-light text-3xl mt-1 tracking-tight">
								Welcome, <Text className="font-semibold">{displayName}</Text>
							</Text>
						</View>

						{/* Daily Routine Summary Card */}
						<Pressable
							onPress={() => router.push("/(modules)/(routines)" as never)}
							className="active:opacity-90 mb-5"
						>
							<Card className="p-5">
								<View className="flex-row items-center justify-between mb-3">
									<View className="flex-row items-center gap-2">
										<View className="w-8 h-8 rounded-xl bg-primary/15 items-center justify-center">
											<Icon icon={Calendar01Icon} size={16} className="text-primary" />
										</View>
										<Text className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
											Today's Routines
										</Text>
									</View>
									<Badge variant="success">
										<Icon icon={TradeUpIcon} size={12} className="text-emerald-500" />
										<Text className="text-emerald-500 text-[11px] font-bold">
											{completedItems}/{totalItems} Done
										</Text>
									</Badge>
								</View>

								<View className="flex-row items-baseline justify-between mb-3">
									<Text className="text-foreground text-4xl font-light">
										{completionRate}
										<Text className="text-2xl text-muted-foreground">%</Text>
									</Text>
									<Text className="text-emerald-500 font-semibold text-xs">
										{totalItems === 0
											? "All routines complete"
											: completedItems === totalItems
												? "🎉 Perfect execution today!"
												: `${totalItems - completedItems} steps remaining`}
									</Text>
								</View>

								{/* Progress Bar */}
								<View className="h-2 w-full bg-muted/60 rounded-full overflow-hidden mb-4">
									<View
										style={{ width: `${completionRate}%` }}
										className="h-full rounded-full bg-primary"
									/>
								</View>

								{/* Interactive Top Checklist (First 3 active items) */}
								{routines.length > 0 ? (
									<View className="pt-3 border-t border-border/40 gap-2">
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
													className="flex-row items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/60"
												>
													<View className="flex-row items-center gap-2.5 flex-1">
														<Icon
															icon={item.completed ? CheckmarkCircle02Icon : CircleIcon}
															size={18}
															className={item.completed ? "text-primary" : "text-muted-foreground"}
														/>
														<Text
															className={cn(
																"text-xs font-medium flex-1",
																item.completed
																	? "text-muted-foreground line-through"
																	: "text-foreground",
															)}
															numberOfLines={1}
														>
															{item.name}
														</Text>
													</View>
													{item.targetTime ? (
														<Text className="text-muted-foreground text-[10px]">
															{item.targetTime}
														</Text>
													) : null}
												</Pressable>
											))}
									</View>
								) : null}
							</Card>
						</Pressable>

						{/* Quick Actions Row */}
						<View className="flex-row gap-3 mb-5">
							<Pressable
								onPress={() => setExpenseModalVisible(true)}
								className="flex-1 p-3.5 rounded-2xl bg-card border border-border flex-row items-center gap-2.5 shadow-sm active:opacity-80"
							>
								<View className="w-8 h-8 rounded-xl bg-amber-500/15 items-center justify-center">
									<Icon icon={PlusSignIcon} size={16} className="text-amber-500" />
								</View>
								<View>
									<Text className="text-foreground font-semibold text-xs">Log Expense</Text>
									<Text className="text-muted-foreground text-[10px]">Add to ledger</Text>
								</View>
							</Pressable>

							<Pressable
								onPress={() => router.push("/(modules)/(routines)" as never)}
								className="flex-1 p-3.5 rounded-2xl bg-card border border-border flex-row items-center gap-2.5 shadow-sm active:opacity-80"
							>
								<View className="w-8 h-8 rounded-xl bg-primary/15 items-center justify-center">
									<Icon icon={Calendar01Icon} size={16} className="text-primary" />
								</View>
								<View>
									<Text className="text-foreground font-semibold text-xs">All Routines</Text>
									<Text className="text-muted-foreground text-[10px]">View checklist</Text>
								</View>
							</Pressable>
						</View>

						{/* Finance Health Section */}
						<View className="mb-5">
							<View className="flex-row items-center justify-between mb-3">
								<Text className="text-foreground font-bold text-sm uppercase tracking-wider">
									Financial Health
								</Text>
								<Pressable onPress={() => router.push("/(modules)/(expenses)" as never)}>
									<Text className="text-amber-500 text-xs font-semibold">View Capital →</Text>
								</Pressable>
							</View>

							{financeLoading && !financeSummary ? (
								<Card className="h-40 items-center justify-center mb-5">
									<ActivityIndicator className="text-amber-500" />
								</Card>
							) : (
								<FinanceSummaryCard summary={financeSummary} />
							)}
						</View>

						{/* Recent Transactions */}
						{recentTransactions && recentTransactions.length > 0 ? (
							<View className="mb-4">
								<View className="flex-row items-center justify-between mb-3">
									<Text className="text-foreground font-bold text-sm uppercase tracking-wider">
										Latest Transactions
									</Text>
									<Pressable
										onPress={() => router.push("/(modules)/(expenses)/transactions" as never)}
									>
										<Text className="text-muted-foreground text-xs">All logs →</Text>
									</Pressable>
								</View>

								{recentTransactions.map((tx) => (
									<View
										key={tx.id}
										className="flex-row items-center justify-between p-3.5 mb-2 rounded-2xl bg-card border border-border/80 shadow-sm"
									>
										<View className="flex-row items-center gap-3 flex-1">
											<View className="w-8 h-8 rounded-xl bg-amber-500/10 items-center justify-center">
												<Icon
													icon={Wallet01Icon}
													size={16}
													className={tx.type === "income" ? "text-emerald-500" : "text-amber-500"}
												/>
											</View>
											<View className="flex-1 pr-2">
												<Text
													className="text-foreground font-medium text-xs capitalize"
													numberOfLines={1}
												>
													{tx.category ?? "Expense"}
												</Text>
												<Text
													className="text-muted-foreground text-[10px] mt-0.5"
													numberOfLines={1}
												>
													{tx.note ?? tx.occurredOn}
												</Text>
											</View>
										</View>
										<Text
											className={cn(
												"font-bold text-xs",
												tx.type === "income" ? "text-emerald-500" : "text-foreground",
											)}
										>
											{tx.type === "income" ? "+" : "-"}
											{formatCurrency(tx.amountMinor, tx.currency)}
										</Text>
									</View>
								))}
							</View>
						) : null}
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
