import { Brain01Icon, FavouriteIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";

export function MindfulnessWidget() {
	return (
		<Pressable className="active:opacity-90">
			<NeonCard>
				<View className="flex-row items-center mb-6">
					<View className="w-10 h-10 rounded-full bg-accent-cyan/10 justify-center items-center mr-3">
						<Icon icon={Brain01Icon} size={20} className="text-accent-cyan" />
					</View>
					<Text className="text-foreground text-base font-semibold flex-1">Mental Clarity</Text>
					<Text className="text-accent-cyan text-sm font-bold">Optimum</Text>
				</View>

				<View className="flex-row justify-between items-center px-1">
					<View className="items-center gap-2 flex-1">
						<Icon icon={Sun03Icon} size={20} className="text-accent-yellow" />
						<Text className="text-foreground text-[15px] font-bold">15m</Text>
						<Text className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.5px]">
							Meditation
						</Text>
					</View>
					<View className="w-px h-10 bg-border" />
					<View className="items-center gap-2 flex-1">
						<Icon icon={FavouriteIcon} size={20} className="text-accent-red" />
						<Text className="text-foreground text-[15px] font-bold">Calm</Text>
						<Text className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.5px]">
							Avg Mood
						</Text>
					</View>
					<View className="w-px h-10 bg-border" />
					<View className="items-center gap-2 flex-1">
						<Icon icon={Moon02Icon} size={20} className="text-accent-purple" />
						<Text className="text-foreground text-[15px] font-bold">7h 45m</Text>
						<Text className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.5px]">
							Deep Sleep
						</Text>
					</View>
				</View>
			</NeonCard>
		</Pressable>
	);
}
