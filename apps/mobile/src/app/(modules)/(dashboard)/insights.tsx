import { Analytics01Icon, FlashIcon, TradeUpIcon } from "@hugeicons/core-free-icons";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui/card";
import { Icon, type IconProp } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { cn } from "@/lib/utils";

export default function InsightsScreen() {
	return (
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					<View className="px-4 pt-2">
						<View className="mb-6">
							<Text className="text-foreground text-3xl font-light tracking-tight">Insights</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								AI-powered analysis of your daily patterns.
							</Text>
						</View>

						<View className="gap-3">
							<InsightCard
								icon={TradeUpIcon}
								iconClass="text-emerald-500 bg-emerald-500/15"
								title="Weekly Trend"
								subtitle="Consistency up 12% this week"
								value="+12%"
								delta="vs last week"
							/>
							<InsightCard
								icon={FlashIcon}
								iconClass="text-amber-500 bg-amber-500/15"
								title="Peak Energy"
								subtitle="Best performance window detected"
								value="10 AM"
								delta="Optimal"
								deltaClass="text-emerald-500"
							/>
							<InsightCard
								icon={Analytics01Icon}
								iconClass="text-blue-500 bg-blue-500/15"
								title="Sleep Quality"
								subtitle="REM cycles improving steadily"
								value="87%"
								delta="+3%"
								deltaClass="text-emerald-500"
							/>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}

function InsightCard({
	icon,
	iconClass,
	title,
	subtitle,
	value,
	delta,
	deltaClass = "text-muted-foreground",
}: {
	icon: IconProp;
	iconClass: string;
	title: string;
	subtitle: string;
	value: string;
	delta: string;
	deltaClass?: string;
}) {
	return (
		<Card className="p-4 flex-row items-center justify-between">
			<View className="flex-row items-center gap-3 flex-1 pr-2">
				<View className={cn("w-10 h-10 rounded-xl items-center justify-center", iconClass)}>
					<Icon icon={icon} size={20} strokeWidth={2} />
				</View>
				<View className="flex-1">
					<Text className="text-foreground font-semibold text-sm">{title}</Text>
					<Text className="text-muted-foreground text-xs mt-0.5">{subtitle}</Text>
				</View>
			</View>
			<View className="items-end">
				<Text className="text-foreground font-bold text-base">{value}</Text>
				<Text className={cn("text-[10px] mt-0.5 font-medium", deltaClass)}>{delta}</Text>
			</View>
		</Card>
	);
}
