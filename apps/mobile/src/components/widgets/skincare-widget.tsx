import { Calendar01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { NeonCard } from "@/components/ui/neon-card";

export function SkincareWidget() {
	const routine = [
		{ name: "Cleanser", time: "08:00 AM", status: "Done", dot: "bg-accent-blue" },
		{ name: "Moisturizer", time: "08:15 AM", status: "Done", dot: "bg-accent-green" },
		{ name: "Sunscreen", time: "09:00 AM", status: "Pending", dot: "bg-accent-orange" },
	];

	return (
		<Pressable className="active:opacity-90">
			<NeonCard>
				<View className="flex-row justify-between items-center mb-2">
					<Text className="text-muted-foreground text-xs font-bold tracking-[2px]">
						DAILY ROUTINE
					</Text>
					<Icon icon={SparklesIcon} size={18} className="text-accent-purple" />
				</View>

				<View className="flex-row justify-between items-center mb-6">
					<Text className="text-foreground text-3xl font-light">
						Morning <Text className="text-muted-foreground text-lg">Set</Text>
					</Text>
					<View className="flex-row items-center gap-1.5 bg-muted px-2.5 py-1 rounded-xl">
						<Icon icon={Calendar01Icon} size={12} className="text-muted-foreground" />
						<Text className="text-muted-foreground text-xs font-semibold">May 7</Text>
					</View>
				</View>

				<View className="gap-4">
					{routine.map((item) => (
						<View key={item.name} className="flex-row justify-between items-center">
							<View className="flex-row items-center gap-3">
								<View className={`w-1 h-6 rounded-full ${item.dot}`} />
								<View>
									<Text className="text-foreground text-[15px] font-semibold">{item.name}</Text>
									<Text className="text-muted-foreground text-xs">{item.time}</Text>
								</View>
							</View>
							<View
								className={`px-2 py-1 rounded-lg ${item.status === "Done" ? "bg-accent-green/15" : "bg-accent-orange/10"}`}
							>
								<Text
									className={`text-[11px] font-bold uppercase ${item.status === "Done" ? "text-accent-green" : "text-accent-orange"}`}
								>
									{item.status}
								</Text>
							</View>
						</View>
					))}
				</View>
			</NeonCard>
		</Pressable>
	);
}
