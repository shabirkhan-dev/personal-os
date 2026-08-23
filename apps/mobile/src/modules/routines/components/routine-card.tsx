import { Calendar01Icon, Time02Icon } from "@hugeicons/core-free-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/providers/theme-provider";
import type { Routine } from "../types/routine.types";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface RoutineCardProps {
	routine: Routine;
	onArchive?: (id: string) => void;
}

export function RoutineCard({ routine, onArchive }: RoutineCardProps) {
	const { colors, isDark } = useTheme();

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
			style={({ pressed }) => [
				styles.card,
				{
					backgroundColor: colors.surface,
					borderColor: colors.card.border,
					opacity: pressed ? 0.9 : 1,
				},
			]}
		>
			<View className="flex-row items-start justify-between mb-2">
				<View className="flex-1 pr-2">
					<Text
						style={{ color: colors.text.primary }}
						className="font-bold text-base tracking-tight"
						numberOfLines={1}
					>
						{routine.name}
					</Text>
					{routine.description ? (
						<Text
							style={{ color: colors.text.secondary }}
							className="text-xs mt-0.5"
							numberOfLines={2}
						>
							{routine.description}
						</Text>
					) : null}
				</View>
				<View className="bg-green-500/15 px-2.5 py-1 rounded-full flex-row items-center gap-1">
					<Icon icon={Calendar01Icon} size={12} color={colors.accent.green} />
					<Text style={{ color: colors.accent.green }} className="text-[11px] font-bold">
						{scheduleBadgeText}
					</Text>
				</View>
			</View>

			{/* Steps List */}
			<View style={{ borderTopColor: colors.card.border }} className="pt-2 border-t gap-1.5 mt-2">
				{routine.items.map((item, index) => (
					<View
						key={item.id}
						style={{
							backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
						}}
						className="flex-row items-center justify-between py-1.5 px-2.5 rounded-lg"
					>
						<Text
							style={{ color: colors.text.primary }}
							className="text-xs font-medium flex-1"
							numberOfLines={1}
						>
							<Text style={{ color: colors.text.muted }} className="font-mono mr-1.5">
								{index + 1}.{" "}
							</Text>
							{item.name}
						</Text>
						{item.targetTime && (
							<View className="flex-row items-center gap-1">
								<Icon icon={Time02Icon} size={12} color={colors.text.secondary} />
								<Text style={{ color: colors.text.secondary }} className="text-[10px]">
									{item.targetTime}
								</Text>
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
		padding: 16,
		borderRadius: 20,
		borderWidth: 1,
		marginBottom: 12,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.04,
		shadowRadius: 8,
		elevation: 2,
	},
});
