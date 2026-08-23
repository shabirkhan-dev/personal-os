import { PlusSignIcon, Task01Icon } from "@hugeicons/core-free-icons";
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
import { BottomNav, ROUTINES_TABS } from "@/components/ui/bottom-nav";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { NeonColors } from "@/constants/design-system";
import {
	AddRoutineModal,
	RoutineCard,
	RoutinesTabs,
	useArchiveRoutineMutation,
	useRoutinesListQuery,
} from "@/modules/routines";

export default function HabitsScreen() {
	const [modalVisible, setModalVisible] = useState(false);
	const { data: routines, isLoading, refetch, isRefetching } = useRoutinesListQuery();
	const archiveMutation = useArchiveRoutineMutation();

	const handleArchive = (id: string) => {
		archiveMutation.mutate(id);
	};

	return (
		<View style={styles.container}>
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.scrollContent}
					refreshControl={
						<RefreshControl
							refreshing={isRefetching}
							onRefresh={refetch}
							tintColor={NeonColors.accent.green}
						/>
					}
				>
					<View style={styles.viewContainer}>
						<View className="flex-row items-center justify-between mb-2">
							<View>
								<Text style={styles.title}>All Routines</Text>
								<Text style={styles.subtitle}>Scheduled habit protocols.</Text>
							</View>
							<Pressable
								onPress={() => setModalVisible(true)}
								style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
								className="bg-green-500/20 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 border border-green-500/30"
							>
								<Icon
									icon={PlusSignIcon}
									size={16}
									color={NeonColors.accent.green}
									strokeWidth={2.5}
								/>
								<Text className="text-green-400 font-bold text-xs">New</Text>
							</Pressable>
						</View>

						<RoutinesTabs active="habits" />

						{isLoading && !routines ? (
							<View className="h-40 items-center justify-center">
								<ActivityIndicator color={NeonColors.accent.green} />
							</View>
						) : routines && routines.length > 0 ? (
							<View className="gap-1">
								{routines.map((routine) => (
									<RoutineCard key={routine.id} routine={routine} onArchive={handleArchive} />
								))}
							</View>
						) : (
							<View className="p-12 rounded-3xl bg-[#15161A] items-center justify-center border border-white/[0.04] mt-4">
								<Icon icon={Task01Icon} size={36} color="#555555" />
								<Text className="text-[#888888] font-medium text-sm mt-3 text-center">
									No routines created yet.{"\n"}Tap "New" or the + button below to create one.
								</Text>
							</View>
						)}
					</View>
				</ScrollView>

				<BottomNav
					tabs={ROUTINES_TABS}
					activeTab="habits"
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
	title: {
		color: NeonColors.text.primary,
		fontSize: 32,
		fontWeight: "300",
	},
	subtitle: {
		color: NeonColors.text.secondary,
		fontSize: 13,
		marginTop: 4,
	},
});
