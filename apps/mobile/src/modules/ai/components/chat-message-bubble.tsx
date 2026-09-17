import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { ChatMessage, SourceRef, SuggestedAction } from "../types/ai.types";

export interface ChatMessageBubbleProps {
	message: ChatMessage;
	onSuggestionPress?: (suggestion: SuggestedAction) => void;
}

export function ChatMessageBubble({ message, onSuggestionPress }: ChatMessageBubbleProps) {
	const isUser = message.role === "user";

	const handleSourcePress = (source: SourceRef) => {
		if (source.type === "routine" || source.type === "routine_item") {
			router.push("/(modules)/(routines)" as never);
		} else if (
			source.type === "finance_category" ||
			source.type === "finance_transaction" ||
			source.type === "budget"
		) {
			router.push("/(modules)/(expenses)" as never);
		}
	};

	const handleSuggestionPress = (suggestion: SuggestedAction) => {
		if (onSuggestionPress) {
			onSuggestionPress(suggestion);
		}
	};

	return (
		<View className={cn("mb-3 px-3", isUser ? "items-end" : "items-start")}>
			{/* Bubble */}
			<View
				className={cn(
					"max-w-[85%] rounded-2xl p-3.5 shadow-sm",
					isUser ? "bg-primary rounded-br-none" : "bg-card border border-border/80 rounded-bl-none",
				)}
			>
				{/* Message Content */}
				<Text
					className={cn(
						"text-sm leading-relaxed",
						isUser ? "text-primary-foreground font-normal" : "text-foreground font-normal",
					)}
				>
					{message.content}
				</Text>

				{/* Assistant Metadata (Model / Latency) */}
				{!isUser && (message.model || message.latencyMs) ? (
					<View className="flex-row items-center gap-1.5 mt-2 pt-1 border-t border-border/40">
						{message.model ? (
							<Text className="text-[10px] text-muted-foreground">{message.model}</Text>
						) : null}
						{message.latencyMs ? (
							<Text className="text-[10px] text-muted-foreground">• {message.latencyMs}ms</Text>
						) : null}
					</View>
				) : null}
			</View>

			{/* Source references (below assistant reply) */}
			{!isUser && message.sources && message.sources.length > 0 ? (
				<View className="flex-row flex-wrap gap-1.5 mt-2 ml-1 max-w-[85%]">
					{message.sources.map((source) => (
						<Pressable
							key={`${source.type}-${source.id}`}
							onPress={() => handleSourcePress(source)}
							className="px-2 py-0.5 rounded-full bg-muted/60 border border-border flex-row items-center gap-1 active:opacity-75"
						>
							<Text className="text-muted-foreground text-[10px] font-medium">Source:</Text>
							<Text className="text-foreground text-[10px] font-semibold">{source.label}</Text>
						</Pressable>
					))}
				</View>
			) : null}

			{/* Suggested Actions (informational/navigational guidance) */}
			{!isUser && message.suggestions && message.suggestions.length > 0 ? (
				<View className="flex-row flex-wrap gap-1.5 mt-2 ml-1 max-w-[85%]">
					{message.suggestions.map((suggestion) => (
						<Pressable
							key={suggestion.title}
							onPress={() => handleSuggestionPress(suggestion)}
							className="px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 flex-row items-center gap-1 active:opacity-80"
						>
							<Text className="text-primary text-[11px] font-semibold">{suggestion.title}</Text>
							<Icon icon={ArrowRight01Icon} size={12} className="text-primary" />
						</Pressable>
					))}
				</View>
			) : null}
		</View>
	);
}
