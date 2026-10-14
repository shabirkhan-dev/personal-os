import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icons";
import { PoText } from "@/components/ui/po-text";
import { usePoTheme } from "@/theme";
import { Spinner } from "./progress-ring";

/** Bottom status line under the card while it is being made. */
export function BuildStatus({ label, busy }: { label: string; busy: boolean }) {
	const { colors } = usePoTheme();
	return (
		<View style={styles.row} accessibilityLiveRegion="polite">
			{busy ? <Spinner /> : <Icon name="Check bold" size={14} color={colors.statusSuccess} />}
			<PoText variant="meta13" tone="textSecondary">
				{label}
			</PoText>
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", gap: 8 },
});
