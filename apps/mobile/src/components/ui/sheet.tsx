import { type ReactNode, useRef, type ComponentRef } from "react";
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/icons";
import { PillButton } from "@/components/ui/pill-button";
import { KeyboardAwareScrollView } from "@/components/ui/keyboard-aware-scroll-view";
import { PoText } from "@/components/ui/po-text";
import { useKeyboardOverlap } from "@/lib/use-keyboard";
import { usePoTheme } from "@/theme";

export type SheetProps = {
	visible: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
	/** Primary action at the bottom; omit for read-only sheets. */
	action?: { label: string; onPress: () => void; disabled?: boolean };
	/** Custom bottom row (e.g. two buttons); used instead of `action`. */
	footer?: ReactNode;
};

/** Space the sheet's head and footer take, so the fields keep the rest when the keyboard is up. */
const CHROME = 190;

/**
 * Bottom sheet for quick entry (add expense, log a meal…). Tap outside or × to close. It rises
 * above the keyboard and keeps the focused field in view.
 */
export function Sheet({ visible, title, onClose, children, action, footer }: SheetProps) {
	const { colors } = usePoTheme();
	const insets = useSafeAreaInsets();
	const { height: screenHeight } = useWindowDimensions();
	const sheet = useRef<ComponentRef<typeof View>>(null);
	const keyboard = useKeyboardOverlap(sheet);
	const bodyHeight =
		keyboard > 0
			? Math.max(140, Math.min(460, screenHeight - keyboard - insets.top - CHROME))
			: 460;

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<View style={styles.fill}>
				<Pressable
					accessibilityRole="button"
					accessibilityLabel="Close"
					onPress={onClose}
					style={[styles.fill, { backgroundColor: colors.bgCanvas, opacity: 0.72 }]}
				/>
				<View
					ref={sheet}
					collapsable={false}
					style={[
						styles.sheet,
						{
							backgroundColor: colors.bgSurface,
							borderColor: colors.borderDefault,
							paddingBottom: keyboard > 0 ? keyboard + 12 : Math.max(20, insets.bottom + 12),
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
					<KeyboardAwareScrollView
						addRoom={false}
						frameStyle={{ maxHeight: bodyHeight }}
						contentContainerStyle={styles.body}
					>
						{children}
					</KeyboardAwareScrollView>
					{footer ??
						(action ? (
							<PillButton
								label={action.label}
								disabled={action.disabled}
								onPress={action.onPress}
							/>
						) : null)}
				</View>
			</View>
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
	body: { gap: 14 },
});
