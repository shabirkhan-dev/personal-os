import { CheckmarkCircle02Icon, CircleIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { NeonColors } from "@/constants/design-system";
import { useTodayQuery, useToggleItemMutation } from "@/modules/routines";

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
	const { data: today, isLoading, isError, refetch, isRefetching } = useTodayQuery();
	const toggleMutation = useToggleItemMutation();

	const totalItems = today?.routines.reduce((sum, routine) => sum + routine.totalItems, 0) ?? 0;
	const completedItems =
		today?.routines.reduce((sum, routine) => sum + routine.completedItems, 0) ?? 0;
	const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

	return (
		<View style={styles.container}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
				>
					<View style={styles.header}>
						<Text style={styles.title}>Today</Text>
						<Text style={styles.subtitle}>
							{today ? formatDisplayDate(today.date) : "Your daily routines"}
						</Text>
						<Pressable
							onPress={() => refetch()}
							style={styles.refreshButton}
							accessibilityRole="button"
							accessibilityLabel="Refresh routines"
						>
							{isRefetching ? (
								<ActivityIndicator size="small" color={NeonColors.accent.green} />
							) : (
								<Icon
									icon={RefreshIcon}
									size={16}
									color={NeonColors.text.secondary}
									strokeWidth={1.8}
								/>
							)}
						</Pressable>
					</View>

					{isLoading && (
						<View style={styles.centered}>
							<ActivityIndicator color={NeonColors.accent.green} />
						</View>
					)}

					{isError && (
						<View style={styles.centered}>
							<Text style={styles.emptyTitle}>Could not load your day</Text>
							<Text style={styles.emptySubtitle}>Pull to refresh or tap the icon above.</Text>
						</View>
					)}

					{today && (
						<>
							<View style={styles.progressCard}>
								<Text style={styles.progressPercent}>{progress}%</Text>
								<Text style={styles.progressLabel}>
									{totalItems === 0
										? "Nothing scheduled today"
										: `${completedItems} of ${totalItems} done`}
								</Text>
								<View style={styles.progressTrack}>
									<View style={[styles.progressFill, { width: `${progress}%` }]} />
								</View>
							</View>

							{today.routines.length === 0 && (
								<View style={styles.centered}>
									<Text style={styles.emptyTitle}>No routines scheduled</Text>
									<Text style={styles.emptySubtitle}>Create routines on web to see them here.</Text>
								</View>
							)}

							{today.routines.map((routine) => {
								const allDone =
									routine.totalItems > 0 && routine.completedItems === routine.totalItems;
								return (
									<View key={routine.id} style={styles.routineCard}>
										<View style={styles.routineHeader}>
											<Text style={styles.routineName}>{routine.name}</Text>
											<View
												style={[styles.badge, allDone ? styles.badgeDone : styles.badgePending]}
											>
												<Text style={[styles.badgeText, allDone && styles.badgeTextDone]}>
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
														toggleMutation.mutate({ routineId: routine.id, itemId: item.id })
													}
													disabled={pending}
													style={({ pressed }) => [
														styles.itemRow,
														pressed && styles.itemRowPressed,
													]}
													accessibilityRole="checkbox"
													accessibilityState={{ checked: item.completed }}
													accessibilityLabel={`${item.completed ? "Uncheck" : "Check"} ${item.name}`}
												>
													{item.completed ? (
														<Icon
															icon={CheckmarkCircle02Icon}
															size={20}
															color={NeonColors.accent.green}
															strokeWidth={2}
														/>
													) : (
														<Icon
															icon={CircleIcon}
															size={20}
															color={NeonColors.text.muted}
															strokeWidth={1.8}
														/>
													)}
													<Text style={[styles.itemName, item.completed && styles.itemNameDone]}>
														{item.name}
													</Text>
													{item.targetTime && (
														<Text style={styles.itemTime}>{item.targetTime}</Text>
													)}
												</Pressable>
											);
										})}
										{routine.items.length === 0 && (
											<Text style={styles.emptySteps}>No steps yet.</Text>
										)}
									</View>
								);
							})}
						</>
					)}
				</ScrollView>
				<BottomNav activeTab="routines" />
			</SafeAreaView>
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
	header: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingHorizontal: 16,
		paddingTop: 8,
		marginBottom: 24,
	},
	title: {
		color: NeonColors.text.primary,
		fontSize: 32,
		fontWeight: "300",
		flex: 1,
	},
	subtitle: {
		color: NeonColors.text.secondary,
		fontSize: 13,
		marginTop: 12,
	},
	refreshButton: {
		marginLeft: 12,
		marginTop: 10,
		padding: 4,
	},
	progressCard: {
		backgroundColor: NeonColors.surface,
		borderWidth: 1,
		borderColor: NeonColors.card.border,
		borderRadius: 16,
		marginHorizontal: 16,
		marginBottom: 24,
		padding: 16,
	},
	progressPercent: {
		color: NeonColors.accent.green,
		fontSize: 36,
		fontWeight: "300",
	},
	progressLabel: {
		color: NeonColors.text.secondary,
		fontSize: 13,
		marginTop: 4,
		marginBottom: 12,
	},
	progressTrack: {
		height: 6,
		borderRadius: 3,
		backgroundColor: "rgba(255, 255, 255, 0.06)",
		overflow: "hidden",
	},
	progressFill: {
		height: "100%",
		borderRadius: 3,
		backgroundColor: NeonColors.accent.green,
	},
	routineCard: {
		backgroundColor: NeonColors.surface,
		borderWidth: 1,
		borderColor: NeonColors.card.border,
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
		color: NeonColors.text.primary,
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
	badgePending: {
		borderColor: NeonColors.card.border,
	},
	badgeText: {
		fontSize: 11,
		fontWeight: "700",
		color: NeonColors.text.secondary,
	},
	badgeTextDone: {
		color: NeonColors.accent.green,
	},
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingVertical: 10,
		paddingHorizontal: 4,
		borderRadius: 8,
	},
	itemRowPressed: {
		backgroundColor: "rgba(255, 255, 255, 0.04)",
	},
	itemName: {
		flex: 1,
		color: NeonColors.text.primary,
		fontSize: 14,
	},
	itemNameDone: {
		color: NeonColors.text.secondary,
		textDecorationLine: "line-through",
	},
	itemTime: {
		color: NeonColors.text.muted,
		fontSize: 11,
	},
	emptySteps: {
		color: NeonColors.text.muted,
		fontSize: 13,
	},
	centered: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 48,
		gap: 8,
	},
	emptyTitle: {
		color: NeonColors.text.primary,
		fontSize: 15,
		fontWeight: "600",
	},
	emptySubtitle: {
		color: NeonColors.text.secondary,
		fontSize: 13,
		textAlign: "center",
	},
});
