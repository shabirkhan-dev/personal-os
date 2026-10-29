import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { HeaderButton } from "@/components/ui/header-button";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { startConversation, useAssistant } from "../hooks/use-assistant";
import { AssistantChat } from "./assistant-chat";

/** The assistant on its own screen: the conversation, past chats behind the title, and New. */
export function AssistantScreen() {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	const { conversation } = useAssistant();
	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			style={[
				styles.root,
				{
					backgroundColor: colors.bgApp,
					paddingTop: insets.top + 6,
					paddingBottom: Math.max(12, insets.bottom + 6),
				},
			]}
		>
			<View style={styles.header}>
				<HeaderButton accessibilityLabel="Back" onPress={() => router.back()} />
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Past chats"
					onPress={() => router.push("/assistant/history")}
					style={[
						styles.pill,
						{ backgroundColor: colors.bgSurface, borderColor: colors.borderDefault },
					]}
				>
					<Icon name="Filled/Sparkle" size={16} color={colors.accentDefault} />
					<PoText variant="text14Medium" numberOfLines={1} style={styles.title}>
						{conversation.messages.length > 0 ? conversation.title : "Assistant"}
					</PoText>
					<Icon name="Filled/Chevron down" size={16} color={colors.textSecondary} />
				</Pressable>
				<HeaderButton
					icon="Line/Plus"
					accessibilityLabel="New chat"
					onPress={() => startConversation()}
				/>
			</View>
			<AssistantChat />
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1, paddingHorizontal: 16 },
	header: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 8 },
	pill: {
		flex: 1,
		height: 40,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingHorizontal: 12,
		borderRadius: 999,
		borderWidth: 1,
	},
	title: { flexShrink: 1 },
});
