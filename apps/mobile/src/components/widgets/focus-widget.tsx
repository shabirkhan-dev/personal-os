import { CheckmarkCircle02Icon, Clock01Icon, Target01Icon } from "@hugeicons/core-free-icons";
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";

export function FocusWidget() {
	return (
		<Pressable className="active:opacity-90">
			<NeonCard className="border-accent-pink/30">
				<View className="flex-row justify-between items-center mb-5">
					<View className="flex-row items-center gap-2">
						<Icon icon={Target01Icon} size={20} className="text-accent-pink" />
						<Text className="text-foreground text-lg font-semibold">Deep Work</Text>
					</View>
					<Text className="text-muted-foreground text-sm">Pomodoro</Text>
				</View>

				<View className="items-center my-4">
					<View className="w-[140px] h-[140px] rounded-full border-4 border-accent-pink bg-accent-pink/5 items-center justify-center">
						<Text className="text-foreground text-[32px] font-bold font-mono">25:00</Text>
						<Text className="text-accent-pink text-xs mt-1 font-semibold">Focus Time</Text>
					</View>
				</View>

				<View className="flex-row justify-around items-center mt-4 pt-4 border-t border-border/40">
					<View className="items-center gap-1">
						<Icon icon={Clock01Icon} size={16} className="text-muted-foreground" />
						<Text className="text-foreground text-base font-semibold">2.5h</Text>
						<Text className="text-muted-foreground text-xs">Today</Text>
					</View>
					<View className="w-px h-6 bg-border" />
					<View className="items-center gap-1">
						<Icon icon={CheckmarkCircle02Icon} size={16} className="text-muted-foreground" />
						<Text className="text-foreground text-base font-semibold">4</Text>
						<Text className="text-muted-foreground text-xs">Sessions</Text>
					</View>
				</View>
			</NeonCard>
		</Pressable>
	);
}
