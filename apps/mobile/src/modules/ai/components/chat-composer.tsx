import { SendIcon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export interface ChatComposerProps {
	onSend: (message: string) => void;
	isSending?: boolean;
	placeholder?: string;
}

export function ChatComposer({
	onSend,
	isSending = false,
	placeholder = "Ask Personal OS...",
}: ChatComposerProps) {
	const [text, setText] = useState("");

	const trimmed = text.trim();
	const canSend = trimmed.length > 0 && !isSending;

	const handleSend = () => {
		if (!canSend) return;
		onSend(trimmed);
		setText("");
	};

	return (
		<View className="px-3 py-2 border-t border-border bg-card flex-row items-end gap-2">
			<View className="flex-1 min-h-[44px] max-h-[120px] bg-muted/40 border border-border rounded-2xl px-3.5 py-2 justify-center">
				<TextInput
					value={text}
					onChangeText={setText}
					placeholder={placeholder}
					placeholderTextColor="#9ca3af"
					multiline
					maxLength={4000}
					className="text-foreground text-sm leading-5 p-0"
					accessibilityLabel="Message input"
					returnKeyType="default"
				/>
			</View>

			<Pressable
				onPress={handleSend}
				disabled={!canSend}
				className={cn(
					"w-10 h-10 rounded-full items-center justify-center transition-all shadow-sm",
					canSend ? "bg-primary active:opacity-85" : "bg-muted opacity-50",
				)}
				accessibilityRole="button"
				accessibilityLabel="Send message"
			>
				{isSending ? (
					<ActivityIndicator size="small" color="#ffffff" />
				) : (
					<Icon icon={SendIcon} size={18} className="text-primary-foreground" />
				)}
			</Pressable>
		</View>
	);
}
