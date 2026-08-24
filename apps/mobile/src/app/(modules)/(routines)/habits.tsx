import { PlusSignIcon, Task01Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
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
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 40 }}
					refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
				>
					<View className="px-4 pt-2">
						<View className="flex-row items-center justify-between mb-2">
							<View>
								<Text className="text-foreground text-3xl font-light tracking-tight">
									All Routines
								</Text>
								<Text className="text-muted-foreground text-xs mt-1">
									Scheduled habit protocols.
								</Text>
							</View>
							<Pressable
								onPress={() => setModalVisible(true)}
								className="bg-primary/20 px-3.5 py-2 rounded-xl flex-row items-center gap-1.5 border border-primary/30 active:opacity-80"
							>
								<Icon icon={PlusSignIcon} size={16} className="text-primary" strokeWidth={2.5} />
								<Text className="text-primary font-bold text-xs">New</Text>
							</Pressable>
						</View>

						<RoutinesTabs active="habits" />

						{isLoading && !routines ? (
							<Card className="h-40 items-center justify-center">
								<ActivityIndicator className="text-primary" />
							</Card>
						) : routines && routines.length > 0 ? (
							<View className="gap-1">
								{routines.map((routine) => (
									<RoutineCard key={routine.id} routine={routine} onArchive={handleArchive} />
								))}
							</View>
						) : (
							<Card className="p-12 items-center justify-center mt-4">
								<Icon icon={Task01Icon} size={36} className="text-muted-foreground" />
								<Text className="text-muted-foreground font-medium text-sm mt-3 text-center">
									No routines created yet.{"\n"}Tap "New" or the + button below to create one.
								</Text>
							</Card>
						)}
					</View>
				</ScrollView>
			</SafeAreaView>

			<AddRoutineModal visible={modalVisible} onClose={() => setModalVisible(false)} />
		</View>
	);
}
