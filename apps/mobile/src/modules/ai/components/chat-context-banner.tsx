import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Text, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import type { ChatContext } from "../types/ai.types";

export interface ChatContextBannerProps {
	context?: ChatContext;
}

export function ChatContextBanner({ context }: ChatContextBannerProps) {
	if (!context || (!context.route && !context.entity && !context.date)) {
		return null;
	}

	return (
		<View className="mx-3 my-2 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex-row items-center gap-2">
			<Icon icon={InformationCircleIcon} size={16} className="text-purple-400" />
			<View className="flex-1">
				<Text className="text-foreground text-xs font-semibold">
					Grounded in Personal OS Context
				</Text>
				<Text className="text-muted-foreground text-[10px]">
					{context.route ? `Screen: ${context.route} ` : ""}
					{context.entity ? `• Entity: ${context.entity.type} ` : ""}
					{context.date ? `• Date: ${context.date}` : ""}
				</Text>
			</View>
		</View>
	);
}
