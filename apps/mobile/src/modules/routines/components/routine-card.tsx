import { Calendar01Icon, Time02Icon } from "@hugeicons/core-free-icons";
import { Alert, Pressable, Text, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
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
		<Pressable onLongPress={handleLongPress} className="active:opacity-90">
			<Card className="p-4 mb-3">
				<View className="flex-row items-start justify-between mb-2">
					<View className="flex-1 pr-2">
						<Text
							className="text-card-foreground font-bold text-base tracking-tight"
							numberOfLines={1}
						>
							{routine.name}
						</Text>
						{routine.description ? (
							<Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={2}>
								{routine.description}
							</Text>
						) : null}
					</View>
					<Badge variant="success">
						<Icon icon={Calendar01Icon} size={12} className="text-emerald-500" />
						<Text className="text-emerald-500 text-[11px] font-bold">{scheduleBadgeText}</Text>
					</Badge>
				</View>

				{/* Steps List */}
				<View className="pt-2 border-t border-border/40 gap-1.5 mt-2">
					{routine.items.map((item, index) => (
						<View
							key={item.id}
							className="flex-row items-center justify-between py-1.5 px-2.5 rounded-xl bg-muted/40"
						>
							<Text className="text-foreground text-xs font-medium flex-1" numberOfLines={1}>
								<Text className="text-muted-foreground font-mono mr-1.5">{index + 1}. </Text>
								{item.name}
							</Text>
							{item.targetTime ? (
								<View className="flex-row items-center gap-1">
									<Icon icon={Time02Icon} size={12} className="text-muted-foreground" />
									<Text className="text-muted-foreground text-[10px]">{item.targetTime}</Text>
								</View>
							) : null}
						</View>
					))}
				</View>
			</Card>
		</Pressable>
	);
}
