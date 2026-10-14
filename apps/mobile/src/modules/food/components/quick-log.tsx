import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type IconName } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { haptics } from "@/lib/haptics";

type QuickButtonProps = {
	icon: IconName;
	label: string;
	onPress?: () => void;
	/** Shown under the label when the button is not available yet. */
	soon?: boolean;
};

function QuickButton({ icon, label, onPress, soon = false }: QuickButtonProps) {
	const { colors } = usePoTheme();
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={soon ? `${label}, coming soon` : label}
			accessibilityState={{ disabled: soon }}
			disabled={soon}
			onPress={() => {
				haptics.tap();
				onPress?.();
			}}
			style={({ pressed }) => [
				styles.button,
				{
					backgroundColor: pressed ? colors.bgHover : colors.bgSurface,
					borderColor: colors.borderDefault,
				},
			]}
		>
			<Icon name={icon} size={16} color={soon ? colors.textTertiary : colors.textPrimary} />
			<View>
				<PoText variant="meta13" tone={soon ? "textTertiary" : "textPrimary"}>
					{label}
				</PoText>
				{soon ? (
					<PoText variant="tab11" tone="textTertiary">
						Soon
					</PoText>
				) : null}
			</View>
		</Pressable>
	);
}

export type QuickLogProps = { onPhoto: () => void; onSay: () => void };

/** Figma "Quick log": Photo, Say it, and Barcode (no scanner on the phone yet, so "Soon"). */
export function QuickLog({ onPhoto, onSay }: QuickLogProps) {
	return (
		<View style={styles.row}>
			<QuickButton icon="Filled/Camera" label="Photo" onPress={onPhoto} />
			<QuickButton icon="Mic" label="Say it" onPress={onSay} />
			<QuickButton icon="Filled/Scan" label="Barcode" soon />
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", gap: 8 },
	button: {
		flex: 1,
		height: 52,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		borderRadius: 26,
		borderWidth: 1,
	},
});
