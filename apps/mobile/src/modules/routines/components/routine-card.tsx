import { Calendar01Icon, Time02Icon } from "@hugeicons/core-free-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonColors } from "@/constants/design-system";
import type { Routine } from "../types/routine.types";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface RoutineCardProps {
	routine: Routine;
	onArchive?: (id: string) => void;
}

export function RoutineCard({ routine, onArchive }: RoutineCardProps) {
	const handleLongPress = () => {
		if (!onArchive) return;
		Alert.alert(
			"Archive Routine",
			`Archive "${routine.name}"? Active completion history will be preserved.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Archive",
					style: "destructive",
					onPress: () => onArchive(routine.id),
				},
			],
		);
	};

	const scheduleBadgeText =
		routine.scheduleType === "daily" || routine.daysOfWeek.length === 0
			? "Daily"
			: routine.daysOfWeek
					.sort((a, b) => a - b)
					.map((d) => DAY_NAMES[d - 1])
					.filter(Boolean)
					.join(", ");

	return (
		<Pressable
			onLongPress={handleLongPress}
			style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
			className="p-4 rounded-3xl bg-[#15161A] border border-white/[0.08] mb-3 shadow-lg"
		>
			<View className="flex-row items-start justify-between mb-2">
				<View className="flex-1 pr-2">
					<Text className="text-white font-bold text-base tracking-tight" numberOfLines={1}>
						{routine.name}
					</Text>
					{routine.description ? (
						<Text className="text-[#888888] text-xs mt-0.5" numberOfLines={2}>
							{routine.description}
						</Text>
					) : null}
				</View>
				<View className="bg-green-500/15 px-2.5 py-1 rounded-full flex-row items-center gap-1">
					<Icon icon={Calendar01Icon} size={12} color={NeonColors.accent.green} />
					<Text className="text-green-400 text-[11px] font-bold">{scheduleBadgeText}</Text>
				</View>
			</View>

			{/* Steps List */}
			<View className="pt-2 border-t border-white/[0.04] gap-1.5 mt-2">
				{routine.items.map((item, index) => (
					<View
						key={item.id}
						className="flex-row items-center justify-between py-1 px-2 rounded-lg bg-[#0B0C10]/60"
					>
						<Text className="text-[#CCCCCC] text-xs font-medium flex-1" numberOfLines={1}>
							<Text className="text-[#666666] font-mono mr-1.5">{index + 1}. </Text>
							{item.name}
						</Text>
						{item.targetTime && (
							<View className="flex-row items-center gap-1">
								<Icon icon={Time02Icon} size={12} color="#888888" />
								<Text className="text-[#888888] text-[10px]">{item.targetTime}</Text>
							</View>
						)}
					</View>
				))}
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: "#15161A",
	},
});
