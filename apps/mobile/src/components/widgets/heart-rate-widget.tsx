import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";

const chartData = [
	{ h: 30, offset: 20 },
	{ h: 40, offset: 15 },
	{ h: 25, offset: 25 },
	{ h: 50, offset: 10, highlight: "bg-accent-purple" },
	{ h: 35, offset: 20 },
	{ h: 45, offset: 15, highlight: "bg-accent-orange" },
	{ h: 60, offset: 5 },
	{ h: 40, offset: 20 },
	{ h: 30, offset: 25 },
	{ h: 55, offset: 10, highlight: "bg-accent-green" },
	{ h: 40, offset: 15 },
];

export function HeartRateWidget() {
	return (
		<Pressable className="active:opacity-90">
			<NeonCard>
				<View className="flex-row justify-between items-center mb-1">
					<Text className="text-muted-foreground text-xs font-bold tracking-[1.5px]">
						TODAY 11:26 PM
					</Text>
					<Icon icon={FavouriteIcon} size={24} className="text-foreground" strokeWidth={1.5} />
				</View>

				<View className="mb-5">
					<Text className="text-foreground text-[56px] font-light">
						72 <Text className="text-muted-foreground text-xl">BPM</Text>
					</Text>
				</View>

				<View className="flex-row gap-10 mb-8">
					<View className="gap-1">
						<View className="flex-row items-center gap-2">
							<View className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
							<Text className="text-muted-foreground text-xs font-bold tracking-[1.5px]">MIN</Text>
						</View>
						<Text className="text-foreground text-lg font-medium pl-3.5">51 BPM</Text>
					</View>
					<View className="gap-1">
						<View className="flex-row items-center gap-2">
							<View className="w-1.5 h-1.5 rounded-full bg-accent-orange" />
							<Text className="text-muted-foreground text-xs font-bold tracking-[1.5px]">PEAK</Text>
						</View>
						<Text className="text-foreground text-lg font-medium pl-3.5">97 BPM</Text>
					</View>
				</View>

				<View className="h-[100px] justify-end">
					<View className="flex-row justify-between items-start h-20 mb-2">
						{chartData.map((item, index) => (
							<View key={`bar-${index}`} className="flex-1 items-center">
								<View
									className={`w-1 rounded-full items-center ${item.highlight ?? "bg-muted-foreground"}`}
									style={{ height: item.h, marginTop: item.offset }}
								>
									{item.highlight ? (
										<View
											className={`absolute -top-1 w-1.5 h-1.5 rounded-full ${item.highlight}`}
										/>
									) : null}
								</View>
							</View>
						))}
					</View>
					<View className="flex-row justify-between px-1">
						<Text className="text-muted-foreground text-[10px] font-semibold">12AM</Text>
						<Text className="text-muted-foreground text-[10px] font-semibold">6AM</Text>
						<Text className="text-muted-foreground text-[10px] font-semibold">12PM</Text>
						<Text className="text-muted-foreground text-[10px] font-semibold">6PM</Text>
					</View>
				</View>
			</NeonCard>
		</Pressable>
	);
}
