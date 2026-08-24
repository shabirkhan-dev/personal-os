import {
	CheckmarkCircle02Icon,
	CircleIcon,
	PlusSignIcon,
	RefreshIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { cn } from "@/lib/utils";
import {
	AddRoutineModal,
	RoutinesTabs,
	useTodayQuery,
	useToggleItemMutation,
} from "@/modules/routines";

function formatDisplayDate(isoDate: string): string {
	const [year, month, day] = isoDate.split("-").map(Number);
	if (!year || !month || !day) return isoDate;
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	});
}

export default function RoutinesTodayScreen() {
	const [modalVisible, setModalVisible] = useState(false);
	const { data: today, isLoading, isError, refetch, isRefetching } = useTodayQuery();
	const toggleMutation = useToggleItemMutation();

	const totalItems = today?.routines.reduce((sum, routine) => sum + routine.totalItems, 0) ?? 0;
	const completedItems =
		today?.routines.reduce((sum, routine) => sum + routine.completedItems, 0) ?? 0;
	const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

	return (
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					<View className="flex-row items-start px-4 pt-2 mb-6">
						<View className="flex-1">
							<Text className="text-foreground text-3xl font-light tracking-tight">Today</Text>
							<Text className="text-muted-foreground text-xs mt-1">
								{today ? formatDisplayDate(today.date) : "Your daily routines"}
							</Text>
						</View>
						<View className="flex-row items-center gap-2">
							<Pressable
								onPress={() => setModalVisible(true)}
								className="bg-primary/20 px-3.5 py-2 rounded-xl flex-row items-center gap-1 border border-primary/30 active:opacity-80"
							>
								<Icon icon={PlusSignIcon} size={14} className="text-primary" strokeWidth={2.5} />
								<Text className="text-primary font-bold text-xs">New</Text>
							</Pressable>
							<Pressable
								onPress={() => refetch()}
								className="p-2 ml-1"
								accessibilityRole="button"
								accessibilityLabel="Refresh routines"
							>
								{isRefetching ? (
									<ActivityIndicator size="small" className="text-primary" />
								) : (
									<Icon
										icon={RefreshIcon}
										size={16}
										className="text-muted-foreground"
										strokeWidth={1.8}
									/>
								)}
							</Pressable>
						</View>
					</View>

					<View className="px-4">
						<RoutinesTabs active="today" />
					</View>

					{isLoading ? (
						<View className="py-12 items-center justify-center">
							<ActivityIndicator className="text-primary" />
						</View>
					) : null}

					{isError ? (
						<View className="py-12 items-center justify-center px-4">
							<Text className="text-foreground text-sm font-semibold">Could not load your day</Text>
							<Text className="text-muted-foreground text-xs mt-1">
								Pull to refresh or tap the icon above.
							</Text>
						</View>
					) : null}

					{today ? (
						<>
							{/* Progress Card */}
							<View className="px-4 mb-5">
								<Card className="p-4">
									<Text className="text-primary text-4xl font-light">{progress}%</Text>
									<Text className="text-muted-foreground text-xs mt-1 mb-3">
										{totalItems === 0
											? "Nothing scheduled today"
											: `${completedItems} of ${totalItems} done`}
									</Text>
									<View className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
										<View
											style={{ width: `${progress}%` }}
											className="h-full rounded-full bg-primary"
										/>
									</View>
								</Card>
							</View>

							{today.routines.length === 0 ? (
								<View className="py-12 items-center justify-center px-4">
									<Text className="text-foreground text-sm font-semibold">
										No routines scheduled
									</Text>
									<Text className="text-muted-foreground text-xs mt-1">
										Create routines to see them here.
									</Text>
								</View>
							) : null}

							<View className="px-4 gap-3">
								{today.routines.map((routine) => {
									const allDone =
										routine.totalItems > 0 && routine.completedItems === routine.totalItems;
									return (
										<Card key={routine.id} className="p-4">
											<View className="flex-row items-center justify-between mb-3">
												<Text className="text-card-foreground font-semibold text-base flex-1">
													{routine.name}
												</Text>
												<Badge variant={allDone ? "success" : "secondary"}>
													<Text
														className={cn(
															"text-[11px] font-bold",
															allDone ? "text-emerald-500" : "text-muted-foreground",
														)}
													>
														{routine.completedItems}/{routine.totalItems}
													</Text>
												</Badge>
											</View>

											{routine.items.map((item) => {
												const pending =
													toggleMutation.isPending && toggleMutation.variables?.itemId === item.id;
												return (
													<Pressable
														key={item.id}
														onPress={() =>
															toggleMutation.mutate({
																routineId: routine.id,
																itemId: item.id,
																completed: !item.completed,
															})
														}
														disabled={pending}
														className="flex-row items-center gap-3 py-2.5 px-2 rounded-xl active:bg-muted/40"
														accessibilityRole="checkbox"
														accessibilityState={{ checked: item.completed }}
														accessibilityLabel={`${item.completed ? "Uncheck" : "Check"} ${item.name}`}
													>
														<Icon
															icon={item.completed ? CheckmarkCircle02Icon : CircleIcon}
															size={20}
															className={item.completed ? "text-primary" : "text-muted-foreground"}
															strokeWidth={item.completed ? 2 : 1.8}
														/>
														<Text
															className={cn(
																"flex-1 text-sm font-medium",
																item.completed
																	? "text-muted-foreground line-through"
																	: "text-foreground",
															)}
														>
															{item.name}
														</Text>
														{item.targetTime ? (
															<Text className="text-muted-foreground text-xs">
																{item.targetTime}
															</Text>
														) : null}
													</Pressable>
												);
											})}
											{routine.items.length === 0 ? (
												<Text className="text-muted-foreground text-xs py-1">No steps yet.</Text>
											) : null}
										</Card>
									);
								})}
							</View>
						</>
					) : null}
				</ScrollView>
			</SafeAreaView>

			<AddRoutineModal visible={modalVisible} onClose={() => setModalVisible(false)} />
		</View>
	);
}
