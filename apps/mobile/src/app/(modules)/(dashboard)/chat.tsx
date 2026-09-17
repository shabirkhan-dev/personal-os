import {
	ArrowLeft01Icon,
	PlusSignIcon,
	RefreshIcon,
	SparklesIcon,
} from "@hugeicons/core-free-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/icon";
import {
	ChatComposer,
	type ChatContext,
	ChatContextBanner,
	type ChatMessage,
	ChatMessageBubble,
	type ContextEntity,
	type SuggestedAction,
	useChatMessagesQuery,
	useChatSessionsQuery,
	useCreateChatSessionMutation,
	useSendMessageMutation,
} from "@/modules/ai";

const STARTER_PROMPTS = [
	"What are my scheduled routines today?",
	"Summarize my expenses for this month",
	"Which habits have I been most consistent with?",
	"How am I tracking against my budget limits?",
];

export default function PersonalOSChatScreen() {
	const params = useLocalSearchParams<{
		sessionId?: string;
		initialPrompt?: string;
		entityType?: string;
		entityId?: string;
		routeContext?: string;
	}>();

	const [activeSessionId, setActiveSessionId] = useState<string | null>(params.sessionId ?? null);
	const [activeContext] = useState<ChatContext | undefined>(() => {
		if (params.entityType && params.entityId) {
			return {
				route: params.routeContext ?? "/(modules)/(dashboard)",
				entity: {
					type: params.entityType as ContextEntity["type"],
					id: params.entityId,
				},
				date: new Date().toISOString().split("T")[0],
			};
		}
		if (params.routeContext) {
			return {
				route: params.routeContext,
				date: new Date().toISOString().split("T")[0],
			};
		}
		return undefined;
	});

	const flatListRef = useRef<FlatList<ChatMessage>>(null);

	// Fetch sessions list to find active or newest session
	const { data: sessionsData } = useChatSessionsQuery({
		limit: 10,
	});

	const createSessionMutation = useCreateChatSessionMutation();

	// Auto-select latest session if none specified
	useEffect(() => {
		if (!activeSessionId && sessionsData?.sessions && sessionsData.sessions.length > 0) {
			setActiveSessionId(sessionsData.sessions[0].id);
		}
	}, [activeSessionId, sessionsData?.sessions]);

	// Fetch messages for active session
	const {
		data: messagesData,
		isLoading: messagesLoading,
		isError: messagesError,
		error: fetchError,
		refetch: refetchMessages,
	} = useChatMessagesQuery(activeSessionId ?? undefined, 100);

	const sendMessageMutation = useSendMessageMutation(activeSessionId ?? "");

	const messages = messagesData?.messages ?? [];

	// Scroll to bottom when messages change
	useEffect(() => {
		if (messages.length > 0) {
			setTimeout(() => {
				flatListRef.current?.scrollToEnd({ animated: true });
			}, 100);
		}
	}, [messages.length]);

	// Handle initialPrompt param if passed from an insight card
	const initialPromptSent = useRef(false);
	useEffect(() => {
		if (params.initialPrompt && !initialPromptSent.current && activeSessionId) {
			initialPromptSent.current = true;
			handleSend(params.initialPrompt);
		}
	}, [params.initialPrompt, activeSessionId]);

	const handleSend = async (text: string) => {
		let targetSessionId = activeSessionId;

		// If no session exists yet, create one first
		if (!targetSessionId) {
			try {
				const newSession = await createSessionMutation.mutateAsync({
					title: text.slice(0, 40),
					context: activeContext,
				});
				targetSessionId = newSession.id;
				setActiveSessionId(newSession.id);
			} catch {
				return;
			}
		}

		sendMessageMutation.mutate({
			message: text,
			context: activeContext,
		});
	};

	const handleNewChat = async () => {
		try {
			const newSession = await createSessionMutation.mutateAsync({
				title: "New Conversation",
				context: activeContext,
			});
			setActiveSessionId(newSession.id);
		} catch {
			// handled by mutation error state
		}
	};

	const handleSuggestionPress = (suggestion: SuggestedAction) => {
		handleSend(suggestion.title);
	};

	const isLimitError =
		sendMessageMutation.isError &&
		sendMessageMutation.error?.message?.includes("AI_SESSION_MESSAGE_LIMIT");

	return (
		<View className="flex-1 bg-background">
			<SafeAreaView edges={["top"]} className="flex-1">
				{/* Top Bar */}
				<View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-card">
					<View className="flex-row items-center gap-2.5 flex-1">
						<Pressable
							onPress={() => router.back()}
							className="w-8 h-8 rounded-full bg-muted/60 items-center justify-center active:opacity-75"
							accessibilityRole="button"
							accessibilityLabel="Go back"
						>
							<Icon icon={ArrowLeft01Icon} size={18} className="text-foreground" />
						</Pressable>

						<View className="flex-1">
							<Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
								Personal OS Assistant
							</Text>
							<Text className="text-muted-foreground text-[10px]">
								Read-only v0 • Grounded in your records
							</Text>
						</View>
					</View>

					{/* New Session Button */}
					<Pressable
						onPress={handleNewChat}
						disabled={createSessionMutation.isPending}
						className="flex-row items-center gap-1 py-1.5 px-3 rounded-full bg-primary/10 border border-primary/20 active:opacity-75"
						accessibilityRole="button"
						accessibilityLabel="Start new chat session"
					>
						<Icon icon={PlusSignIcon} size={14} className="text-primary" />
						<Text className="text-primary text-xs font-semibold">New</Text>
					</Pressable>
				</View>

				{/* Active Grounding Context Banner */}
				<ChatContextBanner context={activeContext} />

				{/* Message Limit Warning Banner */}
				{isLimitError ? (
					<View className="mx-3 my-2 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex-row items-center justify-between">
						<Text className="text-amber-500 text-xs flex-1 pr-2">
							Session reached 200 message limit. Please start a new chat.
						</Text>
						<Pressable
							onPress={handleNewChat}
							className="px-2.5 py-1 rounded-lg bg-amber-500 active:opacity-85"
						>
							<Text className="text-white text-xs font-semibold">New Chat</Text>
						</Pressable>
					</View>
				) : null}

				{/* Error Banner */}
				{messagesError ? (
					<View className="mx-3 my-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex-row items-center justify-between">
						<Text className="text-rose-500 text-xs flex-1 pr-2">
							{fetchError instanceof Error
								? fetchError.message
								: "Failed to load messages from server."}
						</Text>
						<Pressable
							onPress={() => refetchMessages()}
							className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border"
						>
							<Icon icon={RefreshIcon} size={12} className="text-foreground" />
							<Text className="text-foreground text-xs font-medium">Retry</Text>
						</Pressable>
					</View>
				) : null}

				{/* Keyboard avoiding conversation list and composer */}
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					className="flex-1"
					keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
				>
					{/* Message History */}
					{messagesLoading && messages.length === 0 ? (
						<View className="flex-1 items-center justify-center p-6">
							<ActivityIndicator size="small" className="text-primary mb-2" />
							<Text className="text-muted-foreground text-xs">Loading conversation...</Text>
						</View>
					) : messages.length === 0 ? (
						/* Empty State / Quick Prompts */
						<View className="flex-1 justify-center px-4 py-6">
							<View className="items-center mb-6">
								<View className="w-12 h-12 rounded-2xl bg-purple-500/15 items-center justify-center mb-3">
									<Icon icon={SparklesIcon} size={24} className="text-purple-400" />
								</View>
								<Text className="text-foreground font-semibold text-base mb-1 text-center">
									How can I assist you today?
								</Text>
								<Text className="text-muted-foreground text-xs text-center max-w-[280px]">
									Ask questions about your routines, financial summaries, habits, or general life
									planning.
								</Text>
							</View>

							<View className="gap-2 max-w-[340px] self-center w-full">
								{STARTER_PROMPTS.map((prompt) => (
									<Pressable
										key={prompt}
										onPress={() => handleSend(prompt)}
										className="p-3 rounded-2xl bg-card border border-border/80 active:bg-muted/40 shadow-sm"
									>
										<Text className="text-foreground text-xs font-medium">{prompt}</Text>
									</Pressable>
								))}
							</View>
						</View>
					) : (
						<FlatList
							ref={flatListRef}
							data={messages}
							keyExtractor={(item) => item.id}
							renderItem={({ item }) => (
								<ChatMessageBubble message={item} onSuggestionPress={handleSuggestionPress} />
							)}
							contentContainerStyle={{ paddingVertical: 12 }}
							showsVerticalScrollIndicator={false}
							onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
						/>
					)}

					{/* Assistant typing indicator */}
					{sendMessageMutation.isPending ? (
						<View className="px-4 py-2 flex-row items-center gap-2">
							<ActivityIndicator size="small" className="text-primary" />
							<Text className="text-muted-foreground text-xs italic">
								Personal OS is thinking...
							</Text>
						</View>
					) : null}

					{/* Composer */}
					<SafeAreaView edges={["bottom"]}>
						<ChatComposer
							onSend={handleSend}
							isSending={sendMessageMutation.isPending || createSessionMutation.isPending}
							placeholder="Ask about routines, spending, habits..."
						/>
					</SafeAreaView>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</View>
	);
}
