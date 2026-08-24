import { AppleIcon, Bread01Icon, FireIcon, NaturalFoodIcon } from "@hugeicons/core-free-icons";
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";

export function NutritionWidget() {
	return (
		<Pressable className="active:opacity-90">
			<NeonCard>
				<View className="flex-row items-center mb-5">
					<View className="w-10 h-10 rounded-full bg-accent-yellow/10 justify-center items-center mr-3">
						<Icon icon={FireIcon} size={20} className="text-accent-yellow" />
					</View>
					<Text className="text-foreground text-base font-semibold flex-1">Daily Macros</Text>
					<Text className="text-accent-yellow text-sm font-bold">1,450 / 2,200 kcal</Text>
				</View>

				<View className="mb-6">
					<View className="h-2 bg-muted rounded-full overflow-hidden">
						<View className="h-full w-[65%] rounded-full bg-accent-yellow" />
					</View>
				</View>

				<View className="flex-row justify-between px-2">
					<View className="items-center gap-1.5">
						<Icon icon={NaturalFoodIcon} size={18} className="text-accent-red" />
						<Text className="text-foreground text-base font-bold">120g</Text>
						<Text className="text-muted-foreground text-xs font-medium">Protein</Text>
					</View>
					<View className="items-center gap-1.5">
						<Icon icon={Bread01Icon} size={18} className="text-accent-orange" />
						<Text className="text-foreground text-base font-bold">160g</Text>
						<Text className="text-muted-foreground text-xs font-medium">Carbs</Text>
					</View>
					<View className="items-center gap-1.5">
						<Icon icon={AppleIcon} size={18} className="text-accent-green" />
						<Text className="text-foreground text-base font-bold">45g</Text>
						<Text className="text-muted-foreground text-xs font-medium">Fats</Text>
					</View>
				</View>
			</NeonCard>
		</Pressable>
	);
}
