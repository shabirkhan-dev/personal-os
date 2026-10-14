import type { ReactNode } from "react";
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";

export type SheetProps = {
	visible: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
	/** Primary action at the bottom; omit for read-only sheets. */
	action?: { label: string; onPress: () => void; disabled?: boolean };
};

/** Bottom sheet for quick entry (add expense, log a meal…). Tap outside or × to close. */
export function Sheet({ visible, title, onClose, children, action }: SheetProps) {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.fill}
			>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Close"
					onPress={onClose}
					style={[styles.fill, { backgroundColor: colors.bgCanvas, opacity: 0.72 }]}
				/>
				<View
					style={[
						styles.sheet,
						{
							backgroundColor: colors.bgSurface,
							borderColor: colors.borderDefault,
							paddingBottom: Math.max(20, insets.bottom + 12),
						},
					]}
				>
					<View style={styles.head}>
						<PoText variant="title18" accessibilityRole="header">
							{title}
						</PoText>
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
					<ScrollView
						keyboardShouldPersistTaps="handled"
						contentContainerStyle={styles.body}
						style={styles.scroll}
					>
						{children}
					</ScrollView>
					{action ? (
						<PillButton label={action.label} disabled={action.disabled} onPress={action.onPress} />
					) : null}
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	fill: { flex: 1 },
	sheet: {
		gap: 16,
		paddingTop: 20,
		paddingHorizontal: 20,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		borderWidth: 1,
		borderBottomWidth: 0,
	},
	head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
	close: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	scroll: { maxHeight: 460 },
	body: { gap: 14 },
});
