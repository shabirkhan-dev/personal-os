import {
	CheckmarkCircle02Icon,
	CircleIcon,
	PlusSignIcon,
	RefreshIcon,
} from "@hugeicons/core-free-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNav, ROUTINES_TABS } from "@/components/ui/bottom-nav";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import {
	AddRoutineModal,
	RoutinesTabs,
	useTodayQuery,
	useToggleItemMutation,
} from "@/modules/routines";
import { useTheme } from "@/providers/theme-provider";

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
	const { colors, isDark } = useTheme();
	const [modalVisible, setModalVisible] = useState(false);
	const { data: today, isLoading, isError, refetch, isRefetching } = useTodayQuery();
	const toggleMutation = useToggleItemMutation();

	const totalItems = today?.routines.reduce((sum, routine) => sum + routine.totalItems, 0) ?? 0;
	const completedItems =
		today?.routines.reduce((sum, routine) => sum + routine.completedItems, 0) ?? 0;
	const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
				>
					<View style={styles.header}>
						<View className="flex-1">
							<Text style={[styles.title, { color: colors.text.primary }]}>Today</Text>
							<Text style={[styles.subtitle, { color: colors.text.secondary }]}>
								{today ? formatDisplayDate(today.date) : "Your daily routines"}
							</Text>
						</View>
						<View className="flex-row items-center gap-2">
							<Pressable
								onPress={() => setModalVisible(true)}
								style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
								className="bg-green-500/20 px-3 py-2 rounded-xl flex-row items-center gap-1 border border-green-500/30"
							>
								<Icon icon={PlusSignIcon} size={14} color={colors.accent.green} strokeWidth={2.5} />
								<Text style={{ color: colors.accent.green }} className="font-bold text-xs">
									New
								</Text>
							</Pressable>
							<Pressable
								onPress={() => refetch()}
								style={styles.refreshButton}
								accessibilityRole="button"
								accessibilityLabel="Refresh routines"
							>
								{isRefetching ? (
									<ActivityIndicator size="small" color={colors.accent.green} />
								) : (
									<Icon
										icon={RefreshIcon}
										size={16}
										color={colors.text.secondary}
										strokeWidth={1.8}
									/>
								)}
							</Pressable>
						</View>
					</View>

					<View className="px-4">
						<RoutinesTabs active="today" />
					</View>

					{isLoading && (
						<View style={styles.centered}>
							<ActivityIndicator color={colors.accent.green} />
						</View>
					)}

					{isError && (
						<View style={styles.centered}>
							<Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
								Could not load your day
							</Text>
							<Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
								Pull to refresh or tap the icon above.
							</Text>
						</View>
					)}

					{today && (
						<>
							<View
								style={[
									styles.progressCard,
									{
										backgroundColor: colors.surface,
										borderColor: colors.card.border,
									},
								]}
							>
								<Text style={[styles.progressPercent, { color: colors.accent.green }]}>
									{progress}%
								</Text>
								<Text style={[styles.progressLabel, { color: colors.text.secondary }]}>
									{totalItems === 0
										? "Nothing scheduled today"
										: `${completedItems} of ${totalItems} done`}
								</Text>
								<View
									style={[
										styles.progressTrack,
										{
											backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
										},
									]}
								>
									<View
										style={[
											styles.progressFill,
											{ width: `${progress}%`, backgroundColor: colors.accent.green },
										]}
									/>
								</View>
							</View>

							{today.routines.length === 0 && (
								<View style={styles.centered}>
									<Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
										No routines scheduled
									</Text>
									<Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
										Create routines to see them here.
									</Text>
								</View>
							)}

							{today.routines.map((routine) => {
								const allDone =
									routine.totalItems > 0 && routine.completedItems === routine.totalItems;
								return (
									<View
										key={routine.id}
										style={[
											styles.routineCard,
											{
												backgroundColor: colors.surface,
												borderColor: colors.card.border,
											},
										]}
									>
										<View style={styles.routineHeader}>
											<Text style={[styles.routineName, { color: colors.text.primary }]}>
												{routine.name}
											</Text>
											<View
												style={[
													styles.badge,
													allDone
														? styles.badgeDone
														: [styles.badgePending, { borderColor: colors.card.border }],
												]}
											>
												<Text
													style={[
														styles.badgeText,
														{ color: allDone ? colors.accent.green : colors.text.secondary },
													]}
												>
													{routine.completedItems}/{routine.totalItems}
												</Text>
											</View>
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
													style={({ pressed }) => [
														styles.itemRow,
														pressed && {
															backgroundColor: isDark
																? "rgba(255, 255, 255, 0.04)"
																: "rgba(0, 0, 0, 0.03)",
														},
													]}
													accessibilityRole="checkbox"
													accessibilityState={{ checked: item.completed }}
													accessibilityLabel={`${item.completed ? "Uncheck" : "Check"} ${item.name}`}
												>
													{item.completed ? (
														<Icon
															icon={CheckmarkCircle02Icon}
															size={20}
															color={colors.accent.green}
															strokeWidth={2}
														/>
													) : (
														<Icon
															icon={CircleIcon}
															size={20}
															color={colors.text.muted}
															strokeWidth={1.8}
														/>
													)}
													<Text
														style={[
															styles.itemName,
															{
																color: item.completed ? colors.text.secondary : colors.text.primary,
															},
															item.completed && styles.itemNameDone,
														]}
													>
														{item.name}
													</Text>
													{item.targetTime && (
														<Text style={[styles.itemTime, { color: colors.text.muted }]}>
															{item.targetTime}
														</Text>
													)}
												</Pressable>
											);
										})}
										{routine.items.length === 0 && (
											<Text style={[styles.emptySteps, { color: colors.text.muted }]}>
												No steps yet.
											</Text>
										)}
									</View>
								);
							})}
						</>
					)}
				</ScrollView>
				<BottomNav
					tabs={ROUTINES_TABS}
					activeTab="today"
					onAddPress={() => setModalVisible(true)}
				/>
			</SafeAreaView>

			<AddRoutineModal visible={modalVisible} onClose={() => setModalVisible(false)} />
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
		paddingBottom: 40,
	},
	header: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingHorizontal: 16,
		paddingTop: 8,
		marginBottom: 24,
	},
	title: {
		fontSize: 32,
		fontWeight: "300",
		flex: 1,
	},
	subtitle: {
		fontSize: 13,
		marginTop: 12,
	},
	refreshButton: {
		marginLeft: 12,
		marginTop: 10,
		padding: 4,
	},
	progressCard: {
		borderWidth: 1,
		borderRadius: 16,
		marginHorizontal: 16,
		marginBottom: 24,
		padding: 16,
	},
	progressPercent: {
		fontSize: 36,
		fontWeight: "300",
	},
	progressLabel: {
		fontSize: 13,
		marginTop: 4,
		marginBottom: 12,
	},
	progressTrack: {
		height: 6,
		borderRadius: 3,
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		borderRadius: 3,
	},
	routineCard: {
		borderWidth: 1,
		borderRadius: 16,
		marginHorizontal: 16,
		marginBottom: 16,
		padding: 16,
	},
	routineHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 12,
	},
	routineName: {
		fontSize: 16,
		fontWeight: "600",
		flex: 1,
	},
	badge: {
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderWidth: 1,
	},
	badgeDone: {
		borderColor: "rgba(0, 230, 118, 0.4)",
		backgroundColor: "rgba(0, 230, 118, 0.15)",
	},
	badgePending: {},
	badgeText: {
		fontSize: 11,
		fontWeight: "700",
	},
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 10,
		paddingHorizontal: 4,
		borderRadius: 8,
	},
	itemName: {
		flex: 1,
		fontSize: 14,
	},
	itemNameDone: {
		textDecorationLine: "line-through",
	},
	itemTime: {
		fontSize: 11,
	},
	emptySteps: {
		fontSize: 13,
	},
	centered: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
		gap: 8,
	},
	emptyTitle: {
		fontSize: 15,
		fontWeight: "600",
	},
	emptySubtitle: {
		fontSize: 13,
		textAlign: "center",
	},
});
