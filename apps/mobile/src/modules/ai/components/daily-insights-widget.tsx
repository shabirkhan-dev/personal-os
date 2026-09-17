import { ArrowRight01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useDailyIntelligenceQuery } from "../hooks/use-ai-queries";

export function DailyInsightsWidget() {
	const { data, isLoading, isError } = useDailyIntelligenceQuery();

	if (isLoading) {
		return (
			<Card className="p-4 mb-5 border border-border/80 flex-row items-center justify-center gap-2">
				<ActivityIndicator size="small" className="text-primary" />
				<Text className="text-muted-foreground text-xs">Loading Daily Intelligence...</Text>
			</Card>
		);
	}

	if (isError || !data) {
		return null;
	}

	const insights = data.insights ?? [];
	if (insights.length === 0) {
		return null;
	}

	// Pick top priority insight (high first, then medium, then first)
	const topInsight =
		insights.find((i) => i.priority === "high") ||
		insights.find((i) => i.priority === "medium") ||
		insights[0];

	return (
		<Pressable
			onPress={() => router.push("/(modules)/(dashboard)/insights" as never)}
			className="active:opacity-90 mb-5"
		>
			<Card className="p-4 border border-purple-500/30 bg-purple-500/5">
				{/* Header */}
				<View className="flex-row items-center justify-between mb-2">
					<View className="flex-row items-center gap-2">
						<View className="w-7 h-7 rounded-lg bg-purple-500/20 items-center justify-center">
							<Icon icon={SparklesIcon} size={15} className="text-purple-400" />
						</View>
						<Text className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">
							Daily Intelligence
						</Text>
					</View>

					<Badge variant="secondary">
						<Text className="text-purple-400 text-[10px] font-bold uppercase">
							{insights.length} {insights.length === 1 ? "Insight" : "Insights"}
						</Text>
					</Badge>
				</View>

				{/* Highlighted Insight Content */}
				{topInsight ? (
					<View className="mb-2">
						<Text className="text-foreground font-semibold text-sm mb-0.5">{topInsight.title}</Text>
						<Text className="text-muted-foreground text-xs leading-relaxed" numberOfLines={2}>
							{topInsight.detail}
						</Text>
					</View>
				) : null}

				{/* Bottom Bar: Navigation to full insights */}
				<View className="pt-2 border-t border-border/40 flex-row items-center justify-between">
					<Text className="text-muted-foreground text-[11px]">Based on routines and finances</Text>
					<View className="flex-row items-center gap-1">
						<Text className="text-primary text-xs font-semibold">View all</Text>
						<Icon icon={ArrowRight01Icon} size={13} className="text-primary" />
					</View>
				</View>
			</Card>
		</Pressable>
	);
}
