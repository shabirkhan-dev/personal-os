import { Bookmark01Icon, BookOpen01Icon } from "@hugeicons/core-free-icons";
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";

export function LibraryWidget() {
	return (
		<Pressable className="active:opacity-90">
			<NeonCard className="border-accent-teal/30">
				<View className="flex-row justify-between items-center mb-5">
					<View className="flex-row items-center gap-2">
						<Icon icon={BookOpen01Icon} size={20} className="text-accent-teal" />
						<Text className="text-foreground text-lg font-semibold">Currently Reading</Text>
					</View>
					<Text className="text-muted-foreground text-sm">2 Books</Text>
				</View>

				<View className="flex-row items-center gap-4 my-2">
					<View className="w-[60px] h-20 bg-accent-teal rounded-lg items-center justify-center">
						<Icon icon={Bookmark01Icon} size={24} className="text-background" />
					</View>
					<View className="flex-1">
						<Text className="text-foreground text-base font-semibold mb-1">Atomic Habits</Text>
						<Text className="text-muted-foreground text-sm mb-3">James Clear</Text>
						<View className="flex-row items-center gap-3">
							<View className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
								<View className="h-full w-[70%] bg-accent-teal rounded-full" />
							</View>
							<Text className="text-accent-teal text-xs font-semibold">70%</Text>
						</View>
					</View>
				</View>

				<View className="flex-row justify-around items-center mt-5 pt-4 border-t border-border/40">
					<View className="items-center gap-1">
						<Icon icon={Bookmark01Icon} size={16} className="text-muted-foreground" />
						<Text className="text-foreground text-base font-semibold">14</Text>
						<Text className="text-muted-foreground text-xs">Completed</Text>
					</View>
					<View className="w-px h-6 bg-border" />
					<View className="items-center gap-1">
						<Icon icon={BookOpen01Icon} size={16} className="text-muted-foreground" />
						<Text className="text-foreground text-base font-semibold">32</Text>
						<Text className="text-muted-foreground text-xs">Wishlist</Text>
					</View>
				</View>
			</NeonCard>
		</Pressable>
	);
}
