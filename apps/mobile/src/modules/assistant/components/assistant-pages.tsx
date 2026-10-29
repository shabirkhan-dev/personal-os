import { APPROVAL_LABELS, APPROVAL_MODES } from "@personal-os/domain/assistant";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { EmptyCard, ListRow, ScreenTitle, SectionLabel } from "@/components/module-ui";
import { ModuleScreen } from "@/components/module-screen";
import { Card } from "@/components/ui/card";
import { PoText } from "@/components/ui/po-text";
import { SelectCard } from "@/components/ui/select-card";
import { haptics } from "@/lib/haptics";
import { useAuth } from "@/modules/auth";
import { setApproval, useAssistantSettings } from "../data/assistant-settings";
import { showConversation } from "../hooks/use-assistant";
import { assistantApi, assistantErrorMessage } from "../services/assistant-api";

const home = () => router.dismissTo("/");

const when = (iso: string) =>
	new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** Past conversations, newest first; one opens back in the chat. */
export function AssistantHistoryScreen() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	const threads = useQuery({
		queryKey: ["assistant", "threads"],
		queryFn: () => assistantApi.threads(token ?? ""),
		enabled: Boolean(token),
	});

	const open = async (id: string) => {
		if (!token) return;
		try {
			const thread = await assistantApi.thread(token, id);
			showConversation({ threadId: thread.id, title: thread.title, messages: thread.messages });
			router.back();
		} catch (error) {
			console.error("[assistant] could not open a chat", error);
		}
	};

	const remove = async (id: string) => {
		if (!token) return;
		await assistantApi
			.deleteThread(token, id)
			.catch((error: unknown) => console.error("[assistant] could not delete a chat", error));
		await queryClient.invalidateQueries({ queryKey: ["assistant", "threads"] });
	};

	const list = threads.data ?? [];
	return (
		<ModuleScreen
			label="Assistant"
			onHome={home}
			action={{
				icon: "Filled/Edit",
				label: "Assistant settings",
				onPress: () => router.push("/assistant/settings"),
			}}
		>
			<ScreenTitle eyebrow={`${list.length} chats`} title="Past chats" />
			{threads.error ? (
				<PoText variant="meta13" tone="textWarning">
					{assistantErrorMessage(threads.error)}
				</PoText>
			) : null}
			{!threads.isPending && list.length === 0 && !threads.error ? (
				<EmptyCard
					icon="Filled/Sparkle"
					title="No chats yet"
					body="Your conversations with the assistant show up here."
				/>
			) : null}
			{list.length > 0 ? (
				<Card style={styles.list}>
					{list.map((thread, index) => (
						<ListRow
							key={thread.id}
							title={thread.title}
							subtitle={when(thread.updatedAt)}
							action={{ label: "Delete", onPress: () => void remove(thread.id) }}
							last={index === list.length - 1}
							onPress={() => void open(thread.id)}
						/>
					))}
				</Card>
			) : null}
		</ModuleScreen>
	);
}

/** How the assistant asks before changes, and what it remembers (each fact can be deleted). */
export function AssistantSettingsScreen() {
	const { token } = useAuth();
	const queryClient = useQueryClient();
	const { settings } = useAssistantSettings();
	const memories = useQuery({
		queryKey: ["assistant", "memories"],
		queryFn: () => assistantApi.memories(token ?? ""),
		enabled: Boolean(token),
	});

	const forget = async (id: string) => {
		if (!token) return;
		await assistantApi
			.forget(token, id)
			.catch((error: unknown) => console.error("[assistant] could not forget", error));
		await queryClient.invalidateQueries({ queryKey: ["assistant", "memories"] });
	};

	const facts = memories.data ?? [];
	return (
		<ModuleScreen label="Assistant" onHome={home}>
			<ScreenTitle eyebrow="Assistant" title="Settings" />
			<SectionLabel>Before making changes</SectionLabel>
			<View style={styles.options}>
				{APPROVAL_MODES.map((mode) => (
					<SelectCard
						key={mode}
						selected={settings.approval === mode}
						accessibilityLabel={APPROVAL_LABELS[mode].title}
						onPress={() => {
							haptics.select();
							setApproval(mode).catch((error: unknown) =>
								console.error("[assistant] could not save the setting", error),
							);
						}}
					>
						<View style={styles.option}>
							<PoText variant="row15">{APPROVAL_LABELS[mode].title}</PoText>
							<PoText variant="meta13" tone="textSecondary">
								{APPROVAL_LABELS[mode].detail}
							</PoText>
						</View>
					</SelectCard>
				))}
			</View>
			<SectionLabel>What it remembers about you</SectionLabel>
			{facts.length === 0 ? (
				<PoText variant="meta13" tone="textSecondary">
					Nothing yet. Tell the assistant a preference or a goal and it will keep it here.
				</PoText>
			) : (
				<Card style={styles.list}>
					{facts.map((fact, index) => (
						<ListRow
							key={fact.id}
							title={fact.text}
							action={{ label: "Forget", onPress: () => void forget(fact.id) }}
							last={index === facts.length - 1}
						/>
					))}
				</Card>
			)}
		</ModuleScreen>
	);
}

const styles = StyleSheet.create({
	list: { gap: 0, paddingVertical: 4 },
	options: { gap: 8 },
	option: { gap: 2, padding: 16 },
});
