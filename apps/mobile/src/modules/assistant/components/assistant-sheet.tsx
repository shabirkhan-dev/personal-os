import { router } from "expo-router";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { AssistantChat } from "./assistant-chat";

/**
 * The assistant over the current screen, opened with what the person is looking at, so "this"
 * means that record. "Full chat" continues the same conversation on its own screen.
 */
export function AssistantSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<View style={styles.fill}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Close the assistant"
					onPress={onClose}
					style={[styles.fill, { backgroundColor: colors.bgCanvas, opacity: 0.72 }]}
				/>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					style={[
						styles.sheet,
						{
							backgroundColor: colors.bgApp,
							borderColor: colors.borderDefault,
							paddingBottom: Math.max(16, insets.bottom + 8),
						},
					]}
				>
					<View style={styles.head}>
						<View style={styles.title}>
							<Icon name="Filled/Sparkle" size={18} color={colors.accentDefault} />
							<PoText variant="title18" accessibilityRole="header">
								Assistant
							</PoText>
						</View>
						<Pressable
							accessibilityRole="button"
							onPress={() => {
								onClose();
								router.push("/assistant");
							}}
							style={[styles.full, { backgroundColor: colors.bgSubtle }]}
						>
							<PoText variant="meta13">Full chat</PoText>
						</Pressable>
						<Pressable
							accessibilityRole="button"
							accessibilityLabel="Close"
							hitSlop={10}
							onPress={onClose}
							style={[styles.close, { backgroundColor: colors.bgSubtle }]}
						>
							<Icon name="Line/Close" size={16} color={colors.textSecondary} />
						</Pressable>
					</View>
					<AssistantChat />
				</KeyboardAvoidingView>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	fill: StyleSheet.absoluteFill,
	sheet: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		height: "82%",
		paddingHorizontal: 16,
		paddingTop: 16,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		borderWidth: 1,
	},
	head: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 4 },
	title: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
	full: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
	close: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
});
