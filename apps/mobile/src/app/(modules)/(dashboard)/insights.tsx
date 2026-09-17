import { ChatBotIcon, RefreshIcon, SparklesIcon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { OSHeader } from "@/components/ui/os-header";
import { InsightItem, useDailyIntelligenceQuery } from "@/modules/ai";

export default function InsightsScreen() {
	const { data, isLoading, isError, error, refetch, isRefetching } = useDailyIntelligenceQuery();

	const insights = data?.insights ?? [];

	return (
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				<OSHeader />

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 40 }}
					refreshControl={
						<RefreshControl
							refreshing={isRefetching}
							onRefresh={() => refetch()}
							tintColor="#a855f7"
						/>
					}
				>
					<View className="px-4 pt-2">
						{/* Title Header with Ask Chat Shortcut */}
						<View className="flex-row items-start justify-between mb-5">
							<View className="flex-1 pr-2">
								<Text className="text-foreground text-3xl font-light tracking-tight">
									Daily Intelligence
								</Text>
								<Text className="text-muted-foreground text-xs mt-1">
									{data?.date
										? `Analysis for ${data.date}`
										: "AI-powered analysis of your daily patterns"}
									{data?.timeZone ? ` (${data.timeZone})` : ""}
								</Text>
							</View>

							<Pressable
								onPress={() => router.push("/(modules)/(dashboard)/chat" as never)}
								className="flex-row items-center gap-1.5 py-2 px-3 rounded-full bg-primary/10 border border-primary/20 active:opacity-80 shadow-sm"
								accessibilityRole="button"
								accessibilityLabel="Open Assistant Chat"
							>
								<Icon icon={ChatBotIcon} size={16} className="text-primary" />
								<Text className="text-primary text-xs font-semibold">Chat</Text>
							</Pressable>
						</View>

						{/* Loading State */}
						{isLoading ? (
							<Card className="p-8 items-center justify-center my-4 border border-border/60">
								<ActivityIndicator size="small" className="text-primary mb-3" />
								<Text className="text-foreground font-medium text-sm">
									Generating Daily Intelligence...
								</Text>
								<Text className="text-muted-foreground text-xs mt-1 text-center">
									Correlating today's routines, financial logs, and active habits.
								</Text>
							</Card>
						) : null}

						{/* Error State */}
						{isError && !isLoading ? (
							<Card className="p-6 my-4 border border-rose-500/20 bg-rose-500/5 items-center">
								<Text className="text-rose-500 font-semibold text-sm mb-1">
									Could not load Daily Intelligence
								</Text>
								<Text className="text-muted-foreground text-xs text-center mb-4">
									{error instanceof Error
										? error.message
										: "Personal OS AI is temporarily unreachable. Please try again."}
								</Text>
								<Pressable
									onPress={() => refetch()}
									className="flex-row items-center gap-1.5 py-2 px-4 rounded-xl bg-card border border-border active:opacity-75"
								>
									<Icon icon={RefreshIcon} size={14} className="text-foreground" />
									<Text className="text-foreground text-xs font-medium">Retry</Text>
								</Pressable>
							</Card>
						) : null}

						{/* Empty State */}
						{!isLoading && !isError && insights.length === 0 ? (
							<Card className="p-8 my-4 border border-border/60 items-center text-center">
								<View className="w-12 h-12 rounded-2xl bg-muted/60 items-center justify-center mb-3">
									<Icon icon={SparklesIcon} size={22} className="text-muted-foreground" />
								</View>
								<Text className="text-foreground font-semibold text-base mb-1">
									No Insights Available Yet
								</Text>
								<Text className="text-muted-foreground text-xs text-center leading-relaxed mb-4 max-w-[260px]">
									Complete today's routines or log your daily transactions to generate personalized
									daily observations.
								</Text>
								<Pressable
									onPress={() => router.push("/(modules)/(routines)" as never)}
									className="py-2 px-4 rounded-xl bg-primary active:opacity-85"
								>
									<Text className="text-primary-foreground text-xs font-semibold">
										Go to Routines
									</Text>
								</Pressable>
							</Card>
						) : null}

						{/* Insights List */}
						{!isLoading && !isError && insights.length > 0 ? (
							<View className="gap-2">
								{insights.map((insight) => (
									<InsightItem key={insight.id} insight={insight} />
								))}
							</View>
						) : null}
					</View>
				</ScrollView>
			</SafeAreaView>
		</View>
	);
}
