import {
	ArrowRight01Icon,
	Calendar01Icon,
	ChatBotIcon,
	SparklesIcon,
	Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Icon, type IconProp } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Insight, InsightKind, InsightPriority } from "../types/ai.types";

export interface InsightItemProps {
	insight: Insight;
	onAskChat?: (insight: Insight) => void;
}

export function InsightItem({ insight, onAskChat }: InsightItemProps) {
	const iconConfig = getKindIcon(insight.kind);
	const priorityBadge = getPriorityBadge(insight.priority);

	const handleSourcePress = (type: string) => {
		if (type === "routine" || type === "routine_item") {
			router.push("/(modules)/(routines)" as never);
		} else if (type === "finance_category" || type === "finance_transaction" || type === "budget") {
			router.push("/(modules)/(expenses)" as never);
		}
	};

	const handleActionPress = () => {
		if (!insight.suggestedAction) return;
		if (onAskChat) {
			onAskChat(insight);
		} else {
			// Deep link to Chat with context
			router.push({
				pathname: "/(modules)/(dashboard)/chat" as never,
				params: {
					initialPrompt: `Tell me more about: ${insight.title}`,
					entityType: insight.sourceRefs[0]?.type,
					entityId: insight.sourceRefs[0]?.id,
				},
			});
		}
	};

	return (
		<Card className="p-4 mb-3 border border-border/80">
			{/* Top bar: Kind Icon + Priority Badge */}
			<View className="flex-row items-center justify-between mb-2">
				<View className="flex-row items-center gap-2">
					<View className={cn("w-7 h-7 rounded-lg items-center justify-center", iconConfig.bg)}>
						<Icon icon={iconConfig.icon} size={15} className={iconConfig.color} />
					</View>
					<Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
						{insight.kind}
					</Text>
				</View>

				<Badge variant={priorityBadge.variant}>
					<Text className={cn("text-[10px] font-bold uppercase", priorityBadge.textClass)}>
						{insight.priority}
					</Text>
				</Badge>
			</View>

			{/* Title & Narrative Detail */}
			<Text className="text-foreground font-semibold text-sm mb-1">{insight.title}</Text>
			<Text className="text-muted-foreground text-xs leading-relaxed mb-3">{insight.detail}</Text>

			{/* Sources references */}
			{insight.sourceRefs && insight.sourceRefs.length > 0 ? (
				<View className="flex-row flex-wrap gap-1.5 mb-3">
					{insight.sourceRefs.map((source) => (
						<Pressable
							key={`${source.type}-${source.id}`}
							onPress={() => handleSourcePress(source.type)}
							className="px-2.5 py-1 rounded-full bg-muted/60 border border-border flex-row items-center gap-1 active:opacity-75"
						>
							<Text className="text-muted-foreground text-[10px] font-medium">Source:</Text>
							<Text className="text-foreground text-[10px] font-semibold">{source.label}</Text>
						</Pressable>
					))}
				</View>
			) : null}

			{/* Suggested Action / Inquire Button */}
			<View className="pt-2.5 border-t border-border/40 flex-row items-center justify-between">
				{insight.suggestedAction ? (
					<Pressable
						onPress={handleActionPress}
						className="flex-row items-center gap-1.5 active:opacity-80"
					>
						<Text className="text-primary text-xs font-semibold">
							{insight.suggestedAction.title}
						</Text>
						<Icon icon={ArrowRight01Icon} size={13} className="text-primary" />
					</Pressable>
				) : (
					<View />
				)}

				<Pressable
					onPress={() => {
						if (onAskChat) {
							onAskChat(insight);
						} else {
							router.push({
								pathname: "/(modules)/(dashboard)/chat" as never,
								params: {
									initialPrompt: `Why did I receive this insight: "${insight.title}"?`,
									entityType: insight.sourceRefs[0]?.type,
									entityId: insight.sourceRefs[0]?.id,
								},
							});
						}
					}}
					className="flex-row items-center gap-1 py-1 px-2 rounded-lg bg-primary/10 active:opacity-75"
				>
					<Icon icon={ChatBotIcon} size={13} className="text-primary" />
					<Text className="text-primary text-[10px] font-semibold">Ask Assistant</Text>
				</Pressable>
			</View>
		</Card>
	);
}

function getKindIcon(kind: InsightKind): { icon: IconProp; color: string; bg: string } {
	switch (kind) {
		case "routine":
			return { icon: Calendar01Icon, color: "text-blue-500", bg: "bg-blue-500/15" };
		case "finance":
			return { icon: Wallet01Icon, color: "text-amber-500", bg: "bg-amber-500/15" };
		default:
			return { icon: SparklesIcon, color: "text-purple-500", bg: "bg-purple-500/15" };
	}
}

function getPriorityBadge(priority: InsightPriority): {
	variant: "default" | "success" | "secondary" | "destructive" | "outline";
	textClass: string;
} {
	switch (priority) {
		case "high":
			return { variant: "destructive", textClass: "text-rose-500" };
		case "medium":
			return { variant: "secondary", textClass: "text-blue-500" };
		default:
			return { variant: "outline", textClass: "text-muted-foreground" };
	}
}
